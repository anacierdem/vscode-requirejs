const vscode = require('vscode');
const parser = require('./parser');
const search = require('./search');

exports.ReferenceProvider = class {
    provideDefinition(document, position) {
        const fullText = document.getText();
        const currentFilePath = document.fileName;
        const range = document.getWordRangeAtPosition(position);

        let childWord = "";
        let moduleList = {};

        if(range) {
            const textAtCarrot = document.getText(range);
            const fullTextWithoutComments = parser.removeComments(fullText);
            const requireOrDefineStatement = parser.getRequireOrDefineStatement(fullTextWithoutComments);

            if(requireOrDefineStatement) {
                moduleList = parser.getModulesWithPathFromRequireOrDefine(requireOrDefineStatement);
            }

            const modulePath = textAtCarrot in moduleList ? moduleList[textAtCarrot] : null;

            //We matched a module (word is a module)
            if(modulePath) {
                let searchFor = '';
                let stopSearchingFurther;

                if(childWord == "") {//Not a parent - search for the module name (word)
                    searchFor = textAtCarrot;
                    stopSearchingFurther = true;
                } else { //It is a parent, search for the child which is a property of the module
                    searchFor = childWord;
                    stopSearchingFurther = false;
                }
                childWord = "";

                return search.forModule(currentFilePath, modulePath, searchFor, stopSearchingFurther);
            } else { //word is not a module
                return new Promise(resolve => {
                    let continueFrom;

                    let dotPosition = document.offsetAt(new vscode.Position(range._start._line, range._start._character-1));

                    //Do backwards search for a dot
                    dotPosition = fullTextWithoutComments.lastIndexOf('.', dotPosition);
                    const haveParent = dotPosition > 0;

                    let tmpModuleName;
                    if(!haveParent) {
                        tmpModuleName = parser.extractString(document, range)
                    }

                    const constructors = parser.findConstructor(document, textAtCarrot, fullTextWithoutComments);
                    //TODO: also consider window. defined globals
                    //Dont have a parent and have a constructor, follow the constructor
                    if(constructors.length && !haveParent) {
                        //Break search in case the instance and the constructor have the same name
                        if(document.getText(document.getWordRangeAtPosition(constructors[0].range._start)) == textAtCarrot) {
                            resolve(undefined);
                            return;
                        } else {
                            continueFrom = constructors[0].range._start;
                        }
                    } else if(haveParent) { //Have a parent - follow it
                        const propertyParentPosition = document.positionAt(dotPosition);
                        let bracketPosition = document.offsetAt(propertyParentPosition);
                        //Do backwards search for a ")"
                        bracketPosition = fullTextWithoutComments.lastIndexOf(')', bracketPosition);

                        //Immediately invoked define/require
                        if(bracketPosition > 0) {
                            const line = document.lineAt(propertyParentPosition._line).text
                            const path = /['"]([^'"]*)/gi.exec(line);

                            search.forModule(currentFilePath, path[1], textAtCarrot, true).then(refs => {
                                resolve([refs]);
                                return;
                            });
                        } else {
                            continueFrom = propertyParentPosition;
                            childWord = textAtCarrot;
                        }
                    } else { //Neither have a parent nor a constructor, maybe its a module itself? navigate to module
                        let isModule = false;
                        for(let moduleName in moduleList) {
                            if(moduleList[moduleName] == tmpModuleName) {
                                isModule = true;
                                break;
                            }
                        }

                        if(isModule) {
                            search.forModule(currentFilePath, tmpModuleName, "", true).then(refs => {
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
