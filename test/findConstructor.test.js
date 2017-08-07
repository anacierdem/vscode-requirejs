const vscode = require('vscode');
const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('findConstructor', () => {
	test('should return a DocumentLink object with range object points to constructor', () =>
		vscode.workspace.openTextDocument(__dirname.replace('test', '') + 'testFiles/newConstructor.js')
			.then(document => {
				const result = referenceProvider.findConstructor(document, 'foo', document.getText());

				assert.equal(result.length, 1);

				const { _character, _line } = result[0].range._start;

				assert.equal(_character, 18);
				assert.equal(_line, 1);
			})
	);
});
