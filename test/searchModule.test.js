const { normalize } = require('path');
const rootPath = __dirname.replace('test', '').replace(/\\/g, '/');
const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('searchModule', () => {
	test('should resolve with path for moduleA.js', () => {
		return referenceProvider.searchModule('./test1.js', 'moduleA', '', true)
			.then(result => {
				assert.equal(normalize(result.uri._fsPath), normalize(`/${rootPath}testFiles/moduleA.js`));
			});
	});

	test('should find method foo in moduleA.js', () => {
		return referenceProvider.searchModule('./test3.js', 'moduleA', 'foo', true)
			.then(result => {
				assert.equal(normalize(result.uri.path), normalize(`/${rootPath}testFiles/moduleA.js`));
				assert.equal(result.range._start._line, 2);
				assert.equal(result.range._start._character, 8);
			});
	});
});
