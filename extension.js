const { Location, Range, Uri, Position, workspace, commands, languages } = require('vscode');
const path = require('path');

class ReferenceProvider {

    constructor() {
        this.childWord = '';
    }

     /**
     * Remove all white space and new lines from str
     * @param {String} str
     * @return {String}
     */
    stripWhiteSpaceAndNewLines(str) {
        return (str + '').replace(/\s|\r|\n/g, '');
    }

    /**
     * Get a require or define statement from string
     * @param {String} str
     * @return {String} 
     */
    getRequireOrDefineStatement(str) {
        str = this.stripWhiteSpaceAndNewLines(str);
        const match = /(define|require).*{/i.exec(str);
        return match && match[0] || null;
    }

    /**
     * Get partial code from require/define statement until given line and character
     * @param {VSCODE Document} document
     * @param {Int} line to stop
     * @param {Int} characterIndex to stop
     * @return {String} substring for given document ending at given line and character and starting at last define or require
     */
    getRequireOrDefineCodeUntilCharacterIndex(document, line, characterIndex) {
        const textBeforeChar = document.getText(new Range(0, 0, line, characterIndex));
        const textBeforeCharWithoutComments = this.stripAllComments(textBeforeChar);
        const textLowerCased = textBeforeCharWithoutComments.toLowerCase();
        const lastOccuranceDefine = /define\s?\((?![\s\S]*define\s?\()/.exec(textLowerCased);
        const lastOccuranceRequire = /require\s?\((?![\s\S]*require\s?\()/.exec(textLowerCased);
        const defineIndex = lastOccuranceDefine && lastOccuranceDefine.index || -1;
        const requireIndex = lastOccuranceRequire && lastOccuranceRequire.index || -1;
        const lastOccuranceRequireOrDefine = defineIndex > requireIndex ? defineIndex : requireIndex;

        return textBeforeCharWithoutComments.substr(lastOccuranceRequireOrDefine > -1 ? lastOccuranceRequireOrDefine : 0);
    }

    /**
     * Check if string contains multiple define or require statements
     * @param {String} str to search in 
     * @return {Bool}
     */
    stringHasMultipleDefineOrRequireStatements(str) {
        return (str.match(/^\s*(define|require)\(/gm) || []).length > 1;
    }

    /**
     * Check if needle is a module (path) in define or require statement.
     * @param {String} needle to search for
     * @param {String} haystack which might contain needle
     * @return {Bool}
     */
    stringIsPartOfDefineOrRequireStatement(needle, haystack) {
        const anyCharacterOrNewLine = '.|\\r|\\n';
        const defineOrRequire = 'define|require';
        const regex = new RegExp(`(${defineOrRequire})\\((${anyCharacterOrNewLine})*${needle}(${anyCharacterOrNewLine})*(\\)\\.|{)`, 'g');
        return regex.test(haystack);
    }

    /**
     * Get text containing word in range. Text is stripped of comments 
     * if text contains multiple define/require statements only module part is returned
     * or if its is part of define/require only the statement 
     * 
     * @param {VSCODE Document} document 
     * @param {VSCODE Range} range 
     * @return {String} text
     */
    getTextContainingWord(document, range) {
        const text = this.stripAllComments(document.getText());
        const textAtCaret = document.getText(range);

        let textToParse = text;

        if (this.stringHasMultipleDefineOrRequireStatements(text)) {
            const lineContainingWordAtCaret = document.lineAt(range._start._line).text;

            if (this.stringIsPartOfDefineOrRequireStatement(textAtCaret, lineContainingWordAtCaret)) {
                textToParse = lineContainingWordAtCaret;
            } else {
                textToParse = this.getRequireOrDefineCodeUntilCharacterIndex(document, range._start._line, range._end._character);
            }
        }
        
        if (this.stringIsPartOfDefineOrRequireStatement(textAtCaret, textToParse)) {
            const start = text.indexOf(textToParse);
            const end = text.indexOf('{', start) + 1;
            textToParse = text.substr(start, end);

            if (!textToParse && text.startsWith('require')) {
                textToParse = text.substr(start, text.indexOf(').') + 1);
            }
        }

        return textToParse;
    }

    /**
     * Returns obj with name/path pairs from define/require statement
     * @param {String} str
     * @return {Object} 
     */
    getModulesWithPathFromRequireOrDefine(str) {
        str = this.stripWhiteSpaceAndNewLines(str);
        const result = {};
        const pathsAndParams = /\[(.*)\],function\s?\((.*)\)\s?{/i.exec(str);

        function splitAndTrim(str) {
            return str.split(',').map(value => value.trim());
        }

        if (pathsAndParams && pathsAndParams.length === 3) {
            const paths = splitAndTrim(pathsAndParams[1]);
            const params = splitAndTrim(pathsAndParams[2]);

            if (paths.length === params.length) {
                params.forEach((param, index) => result[param] = paths[index].replace(/'/g, ''));
            }
        }

        return result;
    }

     /**
     * Strip blocks of comments either writing using forward slashes or doc type style comment
     * @param {String} str
     * @return {String} 
     */
    stripCommentBlocks(str) {
        return (str + "").replace(/(^\s*\/\/.*\r?\n?)|(^\s*\/\*[\s\S]*?\*\/\r?\n?)/mg, '');
    }

     /**
     * Strip inline comments, comments behind code on a single line.
     * @param {String} str
     * @return {String} 
     */
    stripInlineComments(str) {
        return (str + "").replace(/(.*\w+.*)((\/\/.*)|(\/\*.*\*\/))/mg, '$1');
    }

    /**
     * Strip all comments from string
     * @param {String} str
     * @return {String} 
     */
    stripAllComments(str) {
        return this.stripInlineComments(this.stripCommentBlocks(str));
    }

    /**
     * Search for constructor patterns in haystack and return locations
     * @param {VSCode Document} document
     * @param {String} needle
     * @param {String} haystack
     */
    findConstructor(document, needle, haystack) {
        const test = new RegExp("(?:"+needle+"\\s*=\\s*(?:new)?\\s*)([^\\s(;]*)", "ig");
        const fullText = this.stripInlineComments(document.getText());
        const haystackOffset = fullText !== haystack ? fullText.indexOf(haystack) : 0;
        let searchResult;
        
        const references = [];

        do {
            searchResult = test.exec(haystack);
            if (searchResult) {
                const newPosition = document.positionAt(searchResult.index + searchResult[0].length + haystackOffset);

                const range = document.getWordRangeAtPosition(newPosition);
                if (range) {
                    references.push(new Location(document.uri, range));
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

        if (modulePath.match(/^\./i)) {
            newUriPath = path.resolve(currentFilePath, "../" + modulePath);
        } else {
            newUriPath = path.resolve(workspace.rootPath, workspace.getConfiguration("requireModuleSupport").get("modulePath"), modulePath);
        }
        if (!newUriPath.match(/\.js$/i)) newUriPath += '.js';

        const newUri = Uri.file(newUriPath);
        const newDocument = workspace.openTextDocument(newUri);

        return new Promise(resolve => {
            newDocument.then(doc => {
                const newFullText = doc.getText();
                const test = new RegExp("(\\b" + searchFor + "\\b)", "g");
                let searchResult;
                let found = false;

                const onlyNavigateToFile = workspace.getConfiguration("requireModuleSupport").get("onlyNavigateToFile");

                if (!onlyNavigateToFile) {
                    do {
                        searchResult = test.exec(newFullText);

                        if (searchResult) {
                            found = true;
                            const newPosition = doc.positionAt(searchResult.index);

                            //If not inside a comment, continue at this reference
                            const simpleComment = /^\s*\*/gm;
                            if (!simpleComment.test(doc.lineAt(newPosition._line).text)) {
                                if (stopSearchingFurther) {
                                    resolve( new Location(newUri, newPosition) );
                                    return;
                                } else {
                                    //Invoke a new providerbeginning from the new location
                                    commands.executeCommand('vscode.executeDefinitionProvider', newUri, newPosition).then(refs => {
                                        if (refs.length > 0) {
                                            resolve( refs );
                                            return;
                                        } else {
                                            resolve( new Location(newUri, newPosition) )
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
                if (!found || onlyNavigateToFile) {
                    resolve( new Location(newUri, new Position(0, 0) ));
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
        return document.getText( new Range(
            new Position(range._start._line, range._start._character-startOffset+1),
            new Position(range._start._line, range._start._character+endOffset)
        ));
    }
    /**
     * Searches for a character backwards inside fullText discarding spaces, tabs and newlines
     * Returns the found index-1 or false if any other character is found.
     * The purpose of this function is finding the position of the last character that is not 
     * the given character excluding newline/spaces. For example when finding the parent of a
     * property.
     * @param {String} fullText
     * @param {Number} offset offset at which we start the search from
     * @param {String} searchFor a single character to search for
     */
    doBackwardsSearch(fullText, offset, searchFor) {
        let currentChar;
        let found = false;
        //Do backwards search
        do {
            currentChar = fullText[offset];
            if (currentChar == searchFor) {
                found = true;
            }
            offset--;
            if (found)
                return offset;
        } while(offset >= 0 && (currentChar == " " || currentChar == "\t" || currentChar == "\n" || currentChar == "\r"));
        return false;
    }

     /**
     * @param {VSCODE Document} document 
     * @param {VSCODE Position} position 
     */
    provideDefinition(document, position) {
        const fullText = document.getText();
        const currentFilePath = document.fileName;
        const range = document.getWordRangeAtPosition(position);

        let moduleList = {};        

        if (range) {
            let textToParse = this.getTextContainingWord(document, range);
            const textAtCaret = document.getText(range);
            const requireOrDefineStatement = this.getRequireOrDefineStatement(textToParse);
           
            if (requireOrDefineStatement) {
                moduleList = this.getModulesWithPathFromRequireOrDefine(requireOrDefineStatement);
            }

            const modulePath = textAtCaret in moduleList ? moduleList[textAtCaret] : null;

            //We matched a module (textAtCaret is a module)
            if(modulePath) {
                let searchFor = "";
                let stopSearchingFurther;

                if (ReferenceProvider.childWord == "") {//Not a parent - search for the module name (word)
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
                                        document.offsetAt(new Position(range._start._line, range._start._character-1)) :
                                        0;

                    //Do backwards search for a dot
                    dotPosition = this.doBackwardsSearch(fullText, dotPosition, ".");
                    const hasParent = dotPosition !== false;

                    let tmpModuleName;
                    if (!hasParent) {
                        tmpModuleName = this.extractString(document, range);
                    }

                    const constructors = this.findConstructor(document, textAtCaret, textToParse);
                    //TODO: also consider window. defined globals
                    //Dont have a parent and have a constructor, follow the constructor
                    if(constructors.length && !hasParent) {
                        let constructorName = document.getText(document.getWordRangeAtPosition(constructors[0].range._start));
                        //Break search in case the instance and the constructor have the same name
                        if(constructorName == textAtCaret) {
                            resolve(undefined);
                            return;
                        }
                        //Module is used commonJS style - instead of complicating module list extraction, directly navigate
                        else if(constructorName == 'require') {
                            let re = /(require)\s*\(\s*(['"]*)/gi;
                            re.lastIndex = document.offsetAt(constructors[0].range._start);
                            let stringOffset = re.exec(fullText)[0].length;
                            let string = this.extractString(document, new Range(
                                new Position(constructors[0].range._start._line, constructors[0].range._start._character + stringOffset),
                                new Position(constructors[0].range._start._line, constructors[0].range._start._character + stringOffset)
                            ));

                            this.searchModule(currentFilePath, string, ReferenceProvider.childWord, true).then(refs => {
                                resolve([refs]);
                                return;
                            });
                        } 
                        else
                        {
                            continueFrom = constructors[0].range._start;
                        }
                    } else if (hasParent) { //Have a parent - follow it
                        const propertyParentPosition = document.positionAt(dotPosition);
                        let bracketPosition = document.offsetAt(propertyParentPosition);

                        //Do backwards search for a ")"
                        bracketPosition = this.doBackwardsSearch(fullText, bracketPosition, ")");

                        //Immediately invoked define/require
                        if (bracketPosition !== false) {
                            const line = document.lineAt(propertyParentPosition._line).text;
                            const path = /['"]([^'"]*)/gi.exec(line);

                            if (path.length == 0) {
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
                        for (let moduleName in moduleList) {
                            if (moduleList[moduleName] == tmpModuleName) {
                                isModule = true;
                                break;
                            }
                        }

                        if (isModule || textToParse.startsWith('require') && tmpModuleName) {
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
                    if (continueFrom) {
                        commands.executeCommand('vscode.executeDefinitionProvider', document.uri, continueFrom).then(refs => {

                            for(let i = refs.length-1; i >= 0; i--) {
                                //Discard if same file
                                if (refs[i].uri._path == document.uri._path) {
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

Object.assign(exports, {
    ReferenceProvider,
    activate(context) {
        context.subscriptions.push(
            languages.registerDefinitionProvider(
                { scheme: 'file' }, 
                new ReferenceProvider()
            )
        );
    }
});