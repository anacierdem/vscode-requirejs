const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('checkIfCommentedOut ', () => {
	test('should return true', () => {
		const commentRanges = [
			{ start: 0, end: 10 },
			{ start: 0, end: 30 }
		];

		assert.ok(referenceProvider.checkIfCommentedOut(commentRanges, 20));
	});

	test('should return false', () => {
		const commentRanges = [{ start: 0, end: 10 }];

		assert.ok(!referenceProvider.checkIfCommentedOut(commentRanges, 20));
	});
});
