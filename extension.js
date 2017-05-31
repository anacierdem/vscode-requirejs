var vscode = require('vscode');
var fs = require('fs');
var path = require('path');

const JS_MODE = { scheme: 'file' };

function activate(context) {

    var referenceProvider  = function() {
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        var childWord = "";
        this.provideDefinition = function(document, position) {
            var currentList;
            var fullText = document.getText();
            var currentFilePath = document.fileName;

            /**
             * Fills currentList with path/name pairs given a define/require statement
             * @param {String} str
             */
            var parseRequireDefine = function(str)
            {
                var list, func, result;
                var array = /\[[^\]]*\]/gi;
                var params = /function\s*\([^)]*/gi;

                var m = array.exec(str);

                if(m) {
                    list = JSON.parse(m[0].split("'").join("\""));
                }

                m = params.exec(str);

                if(m) {
                    var test = /([^\s,]+)/g;
                    result = m[0].slice(m[0].indexOf('(')+1).match(test);
                }

                currentList = {}

                if(result)
                result.forEach(function(value, index) {
                    currentList[value] = list[index];
                });
            }

            /**
             * Searched for construction patterns in the fullText and returns locations of constructor calls
             */
            var findConstructor = function(word) {
                var test = new RegExp("(?:"+word+"\\s*=\\s*(?:new)?\\s*)([^\\s(;]*)", "ig");
                var searchResult;

                var references = [];

                do {
                    searchResult = test.exec(fullText);
                    if (searchResult) {
                        var newPosition = document.positionAt(searchResult.index + searchResult[0].indexOf(searchResult[1]));

                        var range = document.getWordRangeAtPosition(newPosition);
                        if(range)
                            references.push(new vscode.Location(document.uri, range));
                    }
                } while (searchResult);
                return references;
            }.bind(this);

            /**
             * Diverges the search to the given module
             * @param {*} modulePath Require path of the target module
             * @param {*} searchFor The string to search for inside the module
             * @param {*} stopSearchingFurther If set to true, do not continue following definitions.
             */
            var searchModule = function(modulePath, searchFor, stopSearchingFurther) {

                var newUriPath;

                if (!!modulePath.match(/^\./i)) {
                    newUriPath = path.resolve(currentFilePath.replace(/\\[^\\/]+$/, '\\'), modulePath);
                } else {
                    newUriPath = path.resolve(vscode.workspace.rootPath, vscode.workspace.getConfiguration("requireModuleSupport").get("modulePath"), modulePath);
                }
                if (!newUriPath.match(/\.js$/i)) newUriPath += '.js';

                try {
                    fs.accessSync(newUriPath);
                } catch (err) {
                    console.log(err);
                    return;
                }

                var newUri = vscode.Uri.file(newUriPath);
                var newDocument = vscode.workspace.openTextDocument(newUri);

                return new Promise(resolve => {
                    newDocument.then(function(doc) {
                        var newFullText = doc.getText()
                        var test = new RegExp("(\\b" + searchFor + "\\b)", "g");
                        var searchResult;
                        var found = false;

                        var onlyNavigateToFile = vscode.workspace.getConfiguration("requireModuleSupport").get("onlyNavigateToFile");

                        if(!onlyNavigateToFile) {
                            do {
                                searchResult = test.exec(newFullText);

                                if (searchResult) {
                                    found = true;
                                    var newPosition = doc.positionAt(searchResult.index);

                                    //If not inside a comment, continue at this reference
                                    var simpleComment = /^\s*\*/gm;
                                    if(!simpleComment.test(doc.lineAt(newPosition._line).text)) {
                                        if(stopSearchingFurther) {
                                            resolve( new vscode.Location(newUri, newPosition) );
                                            return;
                                        } else {
                                            //Invoke a new providerbeginning from the new location
                                            vscode.commands.executeCommand('vscode.executeDefinitionProvider', newUri, newPosition).then(function(refs) {
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
                    });
                });
            }

            /**
             * returns the string literal's contents in document covering range
             * @param {VSCode Document} document Document to extract the string
             * @param {VSCode Range} range Seed range
             */
            var extractString = function(document, range) {
                var char;

                var line = document.lineAt(range._start._line).text;

                var startOffset = 0;
                while(char = line[range._start._character-startOffset], char != "'" && char != "\"" && range._start._character-startOffset >= 0) {
                    startOffset++;
                }

                var endOffset = 0;
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
             * Returns the found index or false if not found.
             * @param {Number} offset offset at which we start the search from
             * @param {String} searchFor a single character to search for
             */
            var doBackwardsSearch = function(offset, searchFor) {
                var currentChar;
                var found = false;

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


            var range = document.getWordRangeAtPosition(position);

            if(range) {
                var word = document.getText(range);

                var params = /(define|require)\s*\(([^)]*)/gi;

                var noComment = fullText.toString().replace(STRIP_COMMENTS, '');
                var tmpResult = params.exec(noComment);

                if(tmpResult && tmpResult[2])
                    parseRequireDefine(tmpResult[2]);

                var modulePath;
                modulePath = currentList[word];

                //We matched a module (word is a module)
                if(modulePath) {
                    var searchFor = "";
                    var stopSearchingFurther;

                    if(childWord == "") {//Not a parent - search for the module name (word)
                        searchFor = word;
                        stopSearchingFurther = true;
                    } else { //It is a parent, search for the child which is a property of the module
                        searchFor = childWord;
                        stopSearchingFurther = false;
                    }
                    childWord = "";

                    return searchModule(modulePath, searchFor, stopSearchingFurther);
                } else { //word is not a module
                    return new Promise(resolve => {
                        var continueFrom;

                        var dotPosition = document.offsetAt(new vscode.Position(range._start._line, range._start._character-1));

                        //Do backwards search for a dot
                        dotPosition = doBackwardsSearch(dotPosition, ".")
                        var haveParent = dotPosition !== false;

                        var tmpModuleName;
                        if(!haveParent) {
                            tmpModuleName = extractString(document, range)
                        }

                        var constructors = findConstructor(word);
                        //TODO: also consider window. defined globals
                        //Dont have a parent and have a constructor, follow the constructor
                        if(constructors.length && !haveParent) {
                            //Break search in case the instance and the constructor have the same name
                            if(document.getText(document.getWordRangeAtPosition(constructors[0].range._start)) == word) {
                                resolve(undefined);
                                return;
                            } else {
                                continueFrom = constructors[0].range._start;
                            }
                        } else if(haveParent) { //Have a parent - follow it
                            var propertyParentPosition = document.positionAt(dotPosition);
                            var propertyParent = document.getText(document.getWordRangeAtPosition(propertyParentPosition));

                            var bracketPosition = document.offsetAt(propertyParentPosition);
                            //Do backwards search for a ")"
                            bracketPosition = doBackwardsSearch(bracketPosition, ")")

                            //Immediately invoked define/require
                            if(bracketPosition !== false) {
                                var line = document.lineAt(propertyParentPosition._line).text
                                var path = /['"]([^'"]*)/gi.exec(line);

                                searchModule(path[1], word, true).then(function(refs) {
                                    resolve([refs]);
                                    return;
                                });
                            } else {
                                continueFrom = propertyParentPosition;
                                childWord = word;
                            }
                        } else { //Neither have a parent nor a constructor, maybe its a module itself? navigate to module
                            var isModule = false;
                            for(var key in currentList) {
                                if(currentList[key] == tmpModuleName) {
                                    isModule = true;
                                    break;
                                }
                            }

                            if(isModule) {
                                searchModule(tmpModuleName, "", true).then(function(refs) {
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
                            vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, continueFrom).then(function(refs) {

                                for(var i = refs.length-1; i >= 0; i--) {
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

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(
            JS_MODE, new referenceProvider()));
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;