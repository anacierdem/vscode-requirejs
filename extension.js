// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

const JS_MODE = { scheme: 'file' };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "require-js" is now active!');

    var referenceProvider  = function() {
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

        var parentWord;
        this.provideDefinition = function(document, position) {
            var currentList;
            var define = function(name, list, func)
            {
                var ARGUMENT_NAMES = /([^\s,]+)/g;

                var fnStr = func.toString().replace(STRIP_COMMENTS, '');
                var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
                if(result === null)
                    result = [];

                currentList = {}

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
                        
                        var range = document.getWordRangeAtPosition(newPosition);

                        if(range) {
                            var word = document.getText(range);
                            if(word == "new") {
                                newPosition = document.positionAt(document.offsetAt(newPosition) + 4);
                                range = document.getWordRangeAtPosition(newPosition);
                                word = document.getText(range);
                                references.push(new vscode.Location(document.uri, range));
                                console.log(word);
                            } else if(word != "null"){
                                references.push(new vscode.Location(document.uri, range));
                                console.log(word);
                            }
                        }

                    }
                } while (m);
                return references;
            }.bind(this);

            var fullText = document.getText();
            var range = document.getWordRangeAtPosition(position);

            if(range) {
                var word = document.getText(range);

                eval(fullText);
                var moduleName = currentList[word];

                if(moduleName) {
                    var newPath = document.uri._formatted;
                    var split = newPath.split("/");
                    newPath = split.splice(0, split.length - 1).join("/");

                    var newUri = vscode.Uri.parse(newPath + "/" + moduleName + ".js");
                    var newDocument = vscode.workspace.openTextDocument(newUri);

                    var searchFor = "";
                    var searchingForModule = false;
                    if(parentWord != "") {
                        searchFor = parentWord;
                        parentWord = "";
                    } else {
                        searchFor = moduleName;
                        searchingForModule = true;
                    }

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
                        } else {
                            if(propertyParent) {
                                continueFrom = propertyParentPosition;
                                parentWord = word;
                            } else {
                                resolve(undefined);
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