const vscode = require('vscode');
const rootPath = __dirname.replace('test', '');
const vscodeStub = {
    workspace: { 
        rootPath: rootPath,
        openTextDocument: vscode.workspace.openTextDocument,
        getConfiguration() {
            return {
                get(conf) {
                    switch(conf) {
                        case 'modulePath':
                            return "testFiles";
                        case 'onlyNavigateToFile':
                            return false;
                    }
                }
            }
        }
    },
    Uri: vscode.Uri,
    Location: vscode.Location,
    commands: vscode.commands,
    Position: vscode.Position
};
const assert = require('assert');
const proxyquire = require('proxyquire');
const { ReferenceProvider } = proxyquire('../extension', { 'vscode': vscodeStub });
const referenceProvider = new ReferenceProvider();

suite('searchModule', () => {
    test('searchModule should resolve with path for moduleA.js', () => {
        return referenceProvider.searchModule('../testFiles', 'moduleA', 'a', true)
            .then(result => {
                assert.equal(result.uri._fsPath, `${rootPath}testFiles\\moduleA.js`);
            });
    });
});