const vscode = require('vscode');
const { normalize } = require('path');
const rootPath = __dirname.replace('test', '').replace(/\\/g, '/');
const vscodeStub = Object.assign(vscode, {
	workspace: {
		rootPath,
		openTextDocument: vscode.workspace.openTextDocument,
		getConfiguration () {
			return { get: conf => conf === 'modulePath' ? 'testFiles' : false };
		}
	}
});
const assert = require('assert');
const proxyquire = require('proxyquire');
const { ReferenceProvider } = proxyquire('../extension', { vscode: vscodeStub });
const referenceProvider = new ReferenceProvider();

suite('searchModule', () => {
	test('should resolve with path for moduleA.js', () => {
		return referenceProvider.searchModule('../testFiles/test1.js', 'moduleA', '', true)
			.then(result => {
				assert.equal(normalize(result.uri._fsPath), normalize(`/${rootPath}testFiles/moduleA.js`));
			});
	});

	test('should find method foo in moduleA.js', () => {
		return referenceProvider.searchModule('../testFiles/test3.js', 'moduleA', 'foo', true)
			.then(result => {
				assert.equal(normalize(result.uri.path), normalize(`/${rootPath}testFiles/moduleA.js`));
				assert.equal(result.range._start._line, 2);
				assert.equal(result.range._start._character, 8);
			});
	});
});
