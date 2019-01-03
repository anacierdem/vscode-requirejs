const sinon = require('sinon');
const proxyquire = require('proxyquire');
const assert = require('assert');
const registerDefinitionProviderStub = sinon.stub();
const vscodeStub = { languages: { registerDefinitionProvider: registerDefinitionProviderStub } };
const extension = proxyquire('../extension', { vscode: vscodeStub });

suite('extension', () => {
	test('should export activate method', () => {
		assert.ok('activate' in extension);
	});

	test('activate should register definition provider', () => {
		const context = { subscriptions: [] };

		extension.activate(context);

		// Reinitializing RequireJS on configuration change
		// and registering the RequireJS definition provider.
		assert.equal(context.subscriptions.length, 2);

		// This is useless!
		assert.deepEqual(
			registerDefinitionProviderStub.getCall(0).args,
			[
				[
					{ scheme: 'file', language: 'javascript' },
					{ scheme: 'file', language: 'javascriptreact' }
				],
				new extension.ReferenceProvider()
			]
		);
	});
});
