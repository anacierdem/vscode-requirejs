const path = require('path');
const vscode = require('vscode');

Object.assign(exports, {

    /**
     * Diverges the search to the given module
     * @param {String} currentFilePath Path of current file
     * @param {*} modulePath Require path of the target module
     * @param {*} searchFor The string to search for inside the module
     * @param {*} stopSearchingFurther If set to true, do not continue following definitions.
     */
    forModule(currentFilePath, modulePath, searchFor, stopSearchingFurther) {
        var newUriPath;

        if (!!modulePath.match(/^\./i)) {
            newUriPath = path.resolve(currentFilePath.replace(/\\[^\\/]+$/, ''), modulePath);
        } else {
            newUriPath = path.resolve(vscode.workspace.rootPath, vscode.workspace.getConfiguration("requireModuleSupport").get("modulePath"), modulePath);
        }
        if (!newUriPath.match(/\.js$/i)) newUriPath += '.js';

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
            }, function() {
                resolve(undefined);
            });
        });
    }
});