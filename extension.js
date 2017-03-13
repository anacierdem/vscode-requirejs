var vscode = require('vscode');

const JS_MODE = { scheme: 'file' };

function activate(context) {

    var referenceProvider  = function() {
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        var parentWord;
        this.provideDefinition = function(document, position) {
            var currentList;
            var result;
            var parseRequireDefine = function(str)
            {
                var list, func;
                var array = new RegExp("\\[.*\\]", "ig");
                var params = new RegExp("function\\s*\\(.*", "ig");

                var singleName = str.split("\"").join("'").split("'")[0];
                if(singleName) {
                    var tmpSplit = singleName.split("\\").join('/').split('/');
                    list = [singleName]
                    result = [tmpSplit[tmpSplit.length-1]];
                }


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
                var test = new RegExp("(?:"+word+"\\s*=\\s*)([^\\s]*)", "ig");
                var m;

                var references = [];

                do {
                    m = test.exec(fullText);
                    if (m) {
                        var newPosition = document.positionAt(m.index + m[0].indexOf(m[1]));

                        var line = document.lineAt(newPosition);

                        var findNew = new RegExp("new\\s*(\\w*)", "g");
                        var found = findNew.exec(line.text);

                        if(found) {
                            
                            newPosition = new vscode.Position(newPosition._line, found.index + found[0].length);
                            range = document.getWordRangeAtPosition(newPosition);
                            word = document.getText(range);
                            references.push(new vscode.Location(document.uri, range));
                            
                        }

                    }
                } while (m);
                return references;
            }.bind(this);

            var finalSearch = function(modulePath, searchFor, searchingForModule) {
                var split = modulePath.split("/");
                var moduleName = split[split.length-1];

                var newPath = vscode.workspace.getConfiguration("requireModuleSupport").get("modulePath") || document.uri._formatted;
                var split = newPath.split("/");
                newPath = split.splice(0, split.length - 1).join("/");

                var newUri = vscode.Uri.parse(newPath + "/" + modulePath + ".js");
                var newDocument = vscode.workspace.openTextDocument(newUri);

                return new Promise(resolve => {
                    newDocument.then(function(doc) {
                        var newFullText = doc.getText()
                        var test = new RegExp("(\\b" + searchFor + "\\b)", "g");
                        var m;

                        do {
                            m = test.exec(newFullText);

                            if (m) {
                                var newPosition = doc.positionAt(m.index);
                                
                                if(searchingForModule) {
                                    resolve( new vscode.Location(newUri, newPosition) );
                                } else {
                                    vscode.commands.executeCommand('vscode.executeDefinitionProvider', newUri, newPosition).then(function(refs) {
                                        if(refs.length > 0) {
                                            resolve( refs );
                                        }
                                    });
                                }
                            }
                        } while (m);
                    });
                });
            }

            var fullText = document.getText();
            var range = document.getWordRangeAtPosition(position);

            if(range) {
                var word = document.getText(range);

                var params = new RegExp("(define|require)\\s*\\(([^)]*)", "ig");

                var noComment = fullText.toString().replace(STRIP_COMMENTS, '');
                var tmpResult = params.exec(noComment);

                parseRequireDefine(tmpResult[2]);

                var modulePath;
                modulePath = currentList[word];

                if(modulePath) {
                    var searchFor = "";
                    var searchingForModule = false;
                    if(parentWord != "") {
                        searchFor = parentWord;
                        parentWord = "";
                    } else {
                        searchFor = moduleName;
                        searchingForModule = true;
                    }

                    return finalSearch(modulePath, searchFor, searchingForModule);
                } else {
                    return new Promise(resolve => {

                        var continueFrom;
                        var results = findConstructor(word);

                        var dot = document.getText( new vscode.Range(
                                                    new vscode.Position(range._start._line, range._start._character-1),
                                                    new vscode.Position(range._start._line, range._start._character)
                                                    ));

                        var allDefinitions = [];

                        if(dot == ".") {
                            var propertyParentPosition = new vscode.Position(range._start._line, range._start._character-1);
                            var propertyParent = document.getText(document.getWordRangeAtPosition(propertyParentPosition));
                        }

                        if(results.length && !propertyParent) {
                            continueFrom = results[0].range._start;
                            if(document.getText(document.getWordRangeAtPosition(continueFrom)) == word) {
                                resolve(undefined);
                                return;
                            }
                        } else {
                            if(propertyParent) {
                                var char = document.getText(new vscode.Range(
                                                    new vscode.Position(propertyParentPosition._line, propertyParentPosition._character-1),
                                                    propertyParentPosition
                                                    ));
                                if(char == ")") {
                                    var line = document.lineAt(propertyParentPosition._line).text
                                    var path = /['"]([^'"]*)/gi.exec(line);
                                    
                                    finalSearch(path[1], word, true).then(function(refs) {
                                        resolve(refs );
                                    });
                                } else {
                                    continueFrom = propertyParentPosition;
                                    parentWord = word;
                                }
                            } else {
                                resolve(undefined);
                                return;
                            }
                        }

                        vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, continueFrom).then(function(refs) {
                            
                            for(var i = refs.length-1; i >= 0; i--) {
                                //Discard if same file
                                if(refs[i].uri._path == document.uri._path) {
                                    refs.splice(i, 1);
                                }
                            }
                            resolve(refs );
                        });
                        
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