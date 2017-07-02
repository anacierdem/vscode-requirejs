const vscode = require('vscode');
const { ReferenceProvider } = require('./referenceProvider');

Object.assign(exports, {
    activate(context) {
        context.subscriptions.push(
            vscode.languages.registerDefinitionProvider(
                { scheme: 'file' }, 
                new ReferenceProvider()
            )
        );
    }
});