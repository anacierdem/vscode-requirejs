var vscode = require('vscode');

const JS_MODE = { scheme: 'file' };

function activate(context) {

    var referenceProvider  = function() {
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        var childWord = "";
        this.provideDefinition = function(document, position) {
            var currentList;
            var result;
            var parseRequireDefine = function(str)
            {
                var list, func;
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

            var findConstructor = function(word) {
                var test = new RegExp("(?:"+word+"\\s*=\\s*(?:new)?\\s*)([^\\s(;]*)", "ig");
                var m;

                var references = [];

                do {
                    m = test.exec(fullText);
                    if (m) {
                        var newPosition = document.positionAt(m.index + m[0].indexOf(m[1]));

                        var range = document.getWordRangeAtPosition(newPosition);
                        if(range)
                            references.push(new vscode.Location(document.uri, range));
                    }
                } while (m);
                return references;
            }.bind(this);

            var searchModule = function(modulePath, searchFor, stopSearchingFurther) {
                var baseUri = vscode.workspace.rootPath + "/" + vscode.workspace.getConfiguration("requireModuleSupport").get("modulePath");

                var newUri = vscode.Uri.file(baseUri + "/" + modulePath + ".js");
                var newDocument = vscode.workspace.openTextDocument(newUri);

                return new Promise(resolve => {
                    newDocument.then(function(doc) {
                        var newFullText = doc.getText()
                        var test = new RegExp("(\\b" + searchFor + "\\b)", "g");
                        var m;
                        var found = false;

                        var onlyNavigateToFile = vscode.workspace.getConfiguration("requireModuleSupport").get("onlyNavigateToFile");

                        if(!onlyNavigateToFile)
                        do {
                            m = test.exec(newFullText);

                            if (m) {
                                found = true;
                                var newPosition = doc.positionAt(m.index);
                                
                                var simpleComment = /^\s*\*/gm;

                                if(!simpleComment.test(doc.lineAt(newPosition._line).text)) {
                                    if(stopSearchingFurther) {
                                        resolve( new vscode.Location(newUri, newPosition) );
                                        return;
                                    } else {
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
                        } while (m && searchFor);

                        if(!found || onlyNavigateToFile) {
                            resolve( new vscode.Location(newUri, new vscode.Position(0, 0) ));
                            return;
                        }
                    });
                });
            }

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

            var fullText = document.getText();
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

                        var haveParent = false;
                        var dotPosition = document.offsetAt(new vscode.Position(range._start._line, range._start._character-1));
                        var currentChar;

                        //Do backwards search for a dot
                        do {
                            currentChar = fullText[dotPosition];
                            if(currentChar == ".") {
                                haveParent = true;
                            }
                            dotPosition--;
                        } while(dotPosition >= 0 && (currentChar == " " || currentChar == "\t" || currentChar == "\n" || currentChar == "\r"));

                        var tmpModuleName;
                        if(!haveParent) {
                            tmpModuleName = extractString(document, range)
                        }

                        var constructors = findConstructor(word);
                        //Dont have a parent and have a constructor, follow the constructor
                        if(constructors.length && !haveParent) {
                            //Break search in case the instance and the constructor have the same name
                            if(document.getText(document.getWordRangeAtPosition(constructors[0].range._start)) == word) {
                                resolve(undefined);
                            } else {
                                continueFrom = constructors[0].range._start;
                            }
                        } else if(haveParent) {
                            var propertyParentPosition = document.positionAt(dotPosition);
                            var propertyParent = document.getText(document.getWordRangeAtPosition(propertyParentPosition));

                            var char = document.getText(new vscode.Range(
                                                new vscode.Position(propertyParentPosition._line, propertyParentPosition._character-1),
                                                propertyParentPosition
                                                ));

                            //immediately invoked
                            //TODO: search backwards
                            if(char == ")") {
                                var line = document.lineAt(propertyParentPosition._line).text
                                var path = /['"]([^'"]*)/gi.exec(line);
                                
                                searchModule(path[1], word, true).then(function(refs) {
                                    resolve([refs]);
                                });
                            } else {
                                continueFrom = propertyParentPosition;
                                childWord = word;
                            }
                        } else {
                            var isModule = false;
                            for(var key in currentList) {
                                if(currentList[key] == tmpModuleName) {
                                    isModule = true;
                                }
                            }

                            if(isModule) {
                                searchModule(tmpModuleName, "", true).then(function(refs) {
                                    resolve([refs]);
                                    return;
                                });
                            } else {
                                resolve(undefined);
                            }
                            return;
                        }

                        if(continueFrom) {
                            vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, continueFrom).then(function(refs) {
                                
                                for(var i = refs.length-1; i >= 0; i--) {
                                    //Discard if same file
                                    if(refs[i].uri._path == document.uri._path) {
                                        refs.splice(i, 1);
                                    }
                                }
                                resolve(refs );
                                return;
                            });
                        }
                    })
                }
            } else {
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