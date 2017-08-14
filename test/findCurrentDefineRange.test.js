const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();
const requireOrDefineStatements = [
	{ start: 0, end: 10 },
	{ start: 0, end: 30 }
];

suite('findCurrentDefineRange', () => {
	test('should return define statement object when carrot position is between start/end position', () => {
		const result = referenceProvider.findCurrentDefineRange(requireOrDefineStatements, 20);

		assert.deepEqual(result, requireOrDefineStatements[1]);
	});

	test('should return null if carrot is not in range', () => {
		const result = referenceProvider.findCurrentDefineRange(requireOrDefineStatements, 31);

		assert.deepEqual(result, null);
	});
});
