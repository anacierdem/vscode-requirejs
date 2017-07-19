const vscode = require('vscode');
const path = require('path');

class ReferenceProvider {

    /**
     * Get a require or define statement from string
     * @param {String} str
     * @return {String} 
     */
    getRequireOrDefineStatement(str) {
        const match = /(define|require)\s*\(([^)]*)/gi.exec(str + "");
        return match && match[0] || null;
    }

    /**
     * Returns obj with name/path pairs from define/require statement
     * @param {String} str
     * @return {Object} 
     */
    getModulesWithPathFromRequireOrDefine(str) {
        let list, result;
        const array = /\[[^\]]*\]/gi;
        const params = /function\s*\([^)]*/gi;

        let m = array.exec(str);

        if(m) {
            list = JSON.parse(m[0].split("'").join("\""));
        }

        m = params.exec(str);

        if(m) {
            var test = /([^\s,]+)/g;
            result = m[0].slice(m[0].indexOf('(')+1).match(test);
        }

        const moduleList = {}

        if(result) {
            result.forEach((value, index) => moduleList[value] = list[index]);
        }

        return moduleList;
    }

    /**
     * Strip comments from string
     * @param {String} str
     * @return {String} 
     */
    removeComments(str) {
        return (str + "").replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
    }

    /**
     * Search for constructor patterns in haystack and return locations
     * @param {VSCode Document} document
     * @param {String} needle
     * @param {String} haystack
     */
    findConstructor(document, needle, haystack) {
        const test = new RegExp("(?:"+needle+"\\s*=\\s*(?:new)?\\s*)([^\\s(;]*)", "ig");
        let searchResult;
        
        const references = [];

        do {
            searchResult = test.exec(haystack);
            if (searchResult) {
                const newPosition = document.positionAt(searchResult.index + searchResult[0].length);

                const range = document.getWordRangeAtPosition(newPosition);
                if(range) {
                    references.push(new vscode.Location(document.uri, range));
                }
            }
        } while (searchResult);

        return references;
    }

    /**
     * Diverges the search to the given module
     * @param {String} currentFilePath Current file path to start search from
     * @param {String} modulePath Require path of the target module
     * @param {String} searchFor The string to search for inside the module
     * @param {Bool} stopSearchingFurther If set to true, do not continue following definitions.
     */
    searchModule(currentFilePath, modulePath, searchFor, stopSearchingFurther) {
        let newUriPath;

        if (!!modulePath.match(/^\./i)) {
            newUriPath = path.resolve(currentFilePath.replace(/\\[^\\/]+$/, ''), modulePath);
        } else {
            newUriPath = path.resolve(vscode.workspace.rootPath, vscode.workspace.getConfiguration("requireModuleSupport").get("modulePath"), modulePath);
        }
        if (!newUriPath.match(/\.js$/i)) newUriPath += '.js';

        const newUri = vscode.Uri.file(newUriPath);
        const newDocument = vscode.workspace.openTextDocument(newUri);

        return new Promise(resolve => {
            newDocument.then(doc => {
                const newFullText = doc.getText();
                const test = new RegExp("(\\b" + searchFor + "\\b)", "g");
                let searchResult;
                let found = false;

                const onlyNavigateToFile = vscode.workspace.getConfiguration("requireModuleSupport").get("onlyNavigateToFile");

                if(!onlyNavigateToFile) {
                    do {
                        searchResult = test.exec(newFullText);

                        if (searchResult) {
                            found = true;
                            const newPosition = doc.positionAt(searchResult.index);

                            //If not inside a comment, continue at this reference
                            const simpleComment = /^\s*\*/gm;
                            if(!simpleComment.test(doc.lineAt(newPosition._line).text)) {
                                if(stopSearchingFurther) {
                                    resolve( new vscode.Location(newUri, newPosition) );
                                    return;
                                } else {
                                    //Invoke a new providerbeginning from the new location
                                    vscode.commands.executeCommand('vscode.executeDefinitionProvider', newUri, newPosition).then(refs => {
                                        if(refs.length > 0) {
                                            resolve( refs );
                                            return;
                                        } else {
                                            resolve( new vscode.Location(newUri, newPosition) )
                                            return;
                                        }
                                    });
                                    return;
                                }
                            }
                        }
                    } while (searchResult && searchFor);
                }

                //Only navigate to the file
                if(!found || onlyNavigateToFile) {
                    resolve( new vscode.Location(newUri, new vscode.Position(0, 0) ));
                    return;
                }
            }, () => resolve(undefined));
        });
    }

    /**
     * returns the string literal's contents in document covering range
     * @param {VSCode Document} document Document to extract the string
     * @param {VSCode Range} range Seed range
     */
    extractString(document, range) {
        let char;

        const line = document.lineAt(range._start._line).text;

        let startOffset = 0;
        while(char = line[range._start._character-startOffset], char != "'" && char != "\"" && range._start._character-startOffset >= 0) {
            startOffset++;
        }

        let endOffset = 0;
        while(char = line[range._start._character+endOffset], char != "'" && char != "\"" && range._start._character+endOffset < line.length) {
            endOffset++;
        }
        return document.getText( new vscode.Range(
                new vscode.Position(range._start._line, range._start._character-startOffset+1),
                new vscode.Position(range._start._line, range._start._character+endOffset)
            ))
    }

    /**
     * Searches for a character backwards inside fullText discarding spaces, tabs and newlines
     * Returns the found index-1 or false if any other character is found.
     * The purpose of this function is finding the position of the last character that is not 
     * the given character excluding newline/spaces. For example when finding the parent of a
     * property.
     * @param {Number} offset offset at which we start the search from
     * @param {String} searchFor a single character to search for
     */
    doBackwardsSearch(fullText, offset, searchFor) {
        let currentChar;
        let found = false;

        //Do backwards search
        do {
            currentChar = fullText[offset];
            if(currentChar == searchFor) {
                found = true;
            }
            offset--;
            if(found)
                return offset;
        } while(offset >= 0 && (currentChar == " " || currentChar == "\t" || currentChar == "\n" || currentChar == "\r"));
        return false;
    }

    provideDefinition(document, position) {
        const fullText = document.getText();
        const currentFilePath = document.fileName;
        const range = document.getWordRangeAtPosition(position);

        let moduleList;        

        if(range) {
            const textAtCaret = document.getText(range);
            const fullTextWithoutComments = this.removeComments(fullText);
            const requireOrDefineStatement = this.getRequireOrDefineStatement(fullTextWithoutComments);

            if(requireOrDefineStatement) {
                moduleList = this.getModulesWithPathFromRequireOrDefine(requireOrDefineStatement);
            }

            let modulePath;
            modulePath = moduleList ? moduleList[textAtCaret] : null;

            //We matched a module (textAtCaret is a module)
            if(modulePath) {
                let searchFor = "";
                let stopSearchingFurther;

                if(ReferenceProvider.childWord == "") {//Not a parent - search for the module name (word)
                    searchFor = textAtCaret;
                    stopSearchingFurther = true;
                } else { //It is a parent, search for the child which is a property of the module
                    searchFor = ReferenceProvider.childWord;
                    stopSearchingFurther = false;
                }
                ReferenceProvider.childWord = "";

                return this.searchModule(currentFilePath, modulePath, searchFor, stopSearchingFurther);
            } else { //word is not a module
                return new Promise(resolve => {
                    let continueFrom;

                    let dotPosition = range._start._character >= 1 ?
                                        document.offsetAt(new vscode.Position(range._start._line, range._start._character-1)) :
                                        0;

                    //Do backwards search for a dot
                    dotPosition = this.doBackwardsSearch(fullText, dotPosition, ".")
                    const haveParent = dotPosition !== false;

                    let tmpModuleName;
                    if(!haveParent) {
                        tmpModuleName = this.extractString(document, range)
                    }

                    const constructors = this.findConstructor(document, textAtCaret, fullText);
                    //TODO: also consider window. defined globals
                    //Dont have a parent and have a constructor, follow the constructor
                    if(constructors.length && !haveParent) {
                        //Break search in case the instance and the constructor have the same name
                        if(document.getText(document.getWordRangeAtPosition(constructors[0].range._start)) == textAtCaret) {
                            resolve(undefined);
                            return;
                        } else {
                            continueFrom = constructors[0].range._start;
                        }
                    } else if(haveParent) { //Have a parent - follow it
                        const propertyParentPosition = document.positionAt(dotPosition);
                        let bracketPosition = document.offsetAt(propertyParentPosition);

                        //Do backwards search for a ")"
                        bracketPosition = this.doBackwardsSearch(fullText, bracketPosition, ")")

                        //Immediately invoked define/require
                        if(bracketPosition !== false) {
                            const line = document.lineAt(propertyParentPosition._line).text
                            const path = /['"]([^'"]*)/gi.exec(line);

                            if(path.length == 0) {
                                resolve(undefined);
                                return;
                            }

                            this.searchModule(currentFilePath, path[1], textAtCaret, true).then(refs => {
                                resolve([refs]);
                                return;
                            });
                        } else {
                            continueFrom = propertyParentPosition;
                            ReferenceProvider.childWord = textAtCaret;
                        }
                    } else { //Neither have a parent nor a constructor, maybe its a module itself? navigate to module
                        let isModule = false;
                        for(let key in moduleList) {
                            if(moduleList[key] == tmpModuleName) {
                                isModule = true;
                                break;
                            }
                        }

                        if(isModule) {
                            this.searchModule(currentFilePath, tmpModuleName, "", true).then(refs => {
                                resolve([refs]);
                                return;
                            });
                        } else {
                            //No match;
                            resolve(undefined);
                            return;
                        }
                    }

                    //Should we continue searching? If so re-invoke a definition provider
                    if(continueFrom) {
                        vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, continueFrom).then(refs => {

                            for(let i = refs.length-1; i >= 0; i--) {
                                //Discard if same file
                                if(refs[i].uri._path == document.uri._path) {
                                    refs.splice(i, 1);
                                }
                            }
                            resolve(refs);
                            return;
                        });
                    }
                })
            }
        } else {
            //No range;
            resolve(undefined);
            return;
        }
    }
}

ReferenceProvider.childWord = "";

Object.assign(exports, {
    ReferenceProvider,
    activate(context) {
        context.subscriptions.push(
            vscode.languages.registerDefinitionProvider(
                { scheme: 'file' }, 
                new ReferenceProvider()
            )
        );
    }
});