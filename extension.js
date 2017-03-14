var vscode = require('vscode');

const JS_MODE = { scheme: 'file' };

function activate(context) {

    var referenceProvider  = function() {
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        var parentWord = "";
        this.provideDefinition = function(document, position) {
            var currentList;
            var result;
            var parseRequireDefine = function(str)
            {
                var list, func;
                var array = /\[[^\]]*\]/gi;
                var params = /function\s*\([^)]*/gi;

                // var isSingle = str.indexOf('[')<0 && str.indexOf('(')<0;
                // if(isSingle) {
                //     var tmpName = str.split("'").join('');
                //     list = [tmpName]
                //     result = [tmpName];
                // }

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
                                                resolve( undefined )
                                                return;
                                            }
                                        });
                                        return;
                                    }
                                } 
                            } 
                        } while (m);

                        if(!found || onlyNavigateToFile) {
                            resolve( new vscode.Location(newUri, new vscode.Position(0, 0) ));
                            return;
                        }
                    });
                });
            }

            var fullText = document.getText();
            var range = document.getWordRangeAtPosition(position);

            if(range) {
                var word = document.getText(range);

                var params = /(define|require)\s*\(([^)]*)/gi;

                var noComment = fullText.toString().replace(STRIP_COMMENTS, '');
                var tmpResult = params.exec(noComment);

                parseRequireDefine(tmpResult[2]);

                var modulePath;
                modulePath = currentList[word];

                if(modulePath) {
                    var searchFor = "";
                    var stopSearchingFurther;

                    if(parentWord != "") {
                        searchFor = parentWord;
                        stopSearchingFurther = false;
                    } else {
                        searchFor = word;
                        stopSearchingFurther = true;
                    }
                    parentWord = "";

                    return searchModule(modulePath, searchFor, stopSearchingFurther);
                } else {
                    return new Promise(resolve => {

                        var continueFrom;
                        var results = findConstructor(word);

                        var before = document.getText( new vscode.Range(
                                                    new vscode.Position(range._start._line, range._start._character-1),
                                                    new vscode.Position(range._start._line, range._start._character)
                                                    ));

                        var allDefinitions = [];
                        var tmpModuleName;

                        if(before == ".") {
                            var propertyParentPosition = new vscode.Position(range._start._line, range._start._character-1);
                            var propertyParent = document.getText(document.getWordRangeAtPosition(propertyParentPosition));
                        } else {
                            //TODO: separate as string finder
                            var char;
                            var startOffset = 0;
                            while(char = document.getText( new vscode.Range(
                                        new vscode.Position(range._start._line, range._start._character-startOffset-1),
                                        new vscode.Position(range._start._line, range._start._character-startOffset)
                                    )), char != "'" && char != "\"" && range._start._character-startOffset-1 >= 1) {
                                startOffset++;
                            }
                            var endOffset = 0;
                            while(char = document.getText( new vscode.Range(
                                        new vscode.Position(range._start._line, range._start._character+endOffset),
                                        new vscode.Position(range._start._line, range._start._character+endOffset+1)
                                    )), char != "'" && char != "\"") {
                                endOffset++;
                            }
                            tmpModuleName = document.getText( new vscode.Range(
                                        new vscode.Position(range._start._line, range._start._character-startOffset),
                                        new vscode.Position(range._start._line, range._start._character+endOffset)
                                    ))
                        }

                        if(results.length && !propertyParent) {
                            if(document.getText(document.getWordRangeAtPosition(results[0].range._start)) == word) {
                                resolve(undefined);
                                return;
                            } else {
                                continueFrom = results[0].range._start;
                            }
                        } else {
                            if(propertyParent) {
                                var char = document.getText(new vscode.Range(
                                                    new vscode.Position(propertyParentPosition._line, propertyParentPosition._character-1),
                                                    propertyParentPosition
                                                    ));

                                //immediately invoked
                                if(char == ")") {
                                    var line = document.lineAt(propertyParentPosition._line).text
                                    var path = /['"]([^'"]*)/gi.exec(line);
                                    
                                    searchModule(path[1], word, true).then(function(refs) {
                                        resolve([refs]);
                                        return;
                                    });
                                } else {
                                    continueFrom = propertyParentPosition;
                                    parentWord = word;
                                }
                            } else {
                                if(tmpModuleName) {
                                    searchModule(tmpModuleName, "", true).then(function(refs) {
                                        resolve([refs]);
                                        return;
                                    });
                                } else {
                                    resolve(undefined);
                                }
                                return;
                            }
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