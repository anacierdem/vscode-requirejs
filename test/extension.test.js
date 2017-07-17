const sinon = require('sinon');
const proxyquire = require('proxyquire');
const assert = require('assert');
const registerDefinitionProviderStub = sinon.stub();
const vscodeStub = {
    languages: { 
        registerDefinitionProvider: registerDefinitionProviderStub
    }
};
const extension = proxyquire('../extension', { vscode: vscodeStub });

suite('extension', () => {
    test('should export activate method', () => {
        assert.ok('activate' in extension);
    });

    test('activate should register definition provider', () => {
        const context = {
            subscriptions: []
        };
        extension.activate(context);

        assert.equal(context.subscriptions.length, 1);
        assert.deepEqual(
            registerDefinitionProviderStub.getCall(0).args,
            [
                { scheme: 'file' },
                new extension.ReferenceProvider()
            ]
        )
    });
});