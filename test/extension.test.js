const sinon = require('sinon');
const proxyquire = require('proxyquire');
const assert = require('assert');
const registerDefinitionProviderStub = sinon.stub();
const registerCompletionItemProviderStub = sinon.stub();
const vscodeStub = {
	languages: {
		registerDefinitionProvider: registerDefinitionProviderStub,
		registerCompletionItemProvider: registerCompletionItemProviderStub
	}
};
const extension = proxyquire('../extension', { vscode: vscodeStub });

suite('extension', () => {
	test('should export activate method', () => {
		assert.ok('activate' in extension);
	});

	test('activate should register definition provider and autocompletion', () => {
		const context = { subscriptions: [] };

		extension.activate(context);

		// Reinitializing RequireJS on configuration change
		// and registering the RequireJS definition provider.
		assert.equal(context.subscriptions.length, 3);
		assert.deepEqual(
			registerDefinitionProviderStub.getCall(0).args,
			[
				{ scheme: 'file', language: 'javascript' },
				new extension.ReferenceProvider()
			]
		);
	});
});
