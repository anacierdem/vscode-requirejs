const assert = require('assert');
const { workspace, Position } = require('vscode');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

// Integration tests
suite('referenceProvider basic.js', () => {
	const startOfDocument = {
		_end: {
			_character: 0,
			_line: 0
		},
		_start: {
			_character: 0,
			_line: 0
		}
	};

	const propRange = {
		_end: {
			_character: 12,
			_line: 2
		},
		_start: {
			_character: 8,
			_line: 2
		}
	};

	const bazRange = {
		_end: {
			_character: 11,
			_line: 8
		},
		_start: {
			_character: 8,
			_line: 8
		}
	};

	const tests = {
		moduleA: {
			source: __dirname.replace('test', '') + 'testFiles/basic.js',
			position: new Position(0, 14),
			expectedTarget: __dirname.replace('test', '') + 'testFiles/moduleA.js',
			expectedRange: startOfDocument
		},
		moduleB: {
			source: __dirname.replace('test', '') + 'testFiles/basic.js',
			position: new Position(0, 24),
			expectedTarget: __dirname.replace('test', '') + 'testFiles/moduleB.js',
			expectedRange: startOfDocument
		},
		baz: {
			source: __dirname.replace('test', '') + 'testFiles/basic.js',
			position: new Position(3, 11),
			expectedTarget: __dirname.replace('test', '') + 'testFiles/moduleA.js',
			expectedRange: bazRange
		},
		prop: {
			source: __dirname.replace('test', '') + 'testFiles/basic.js',
			position: new Position(4, 11),
			expectedTarget: __dirname.replace('test', '') + 'testFiles/moduleB.js',
			expectedRange: propRange
		},
		a: {
			source: __dirname.replace('test', '') + 'testFiles/basic.js',
			position: new Position(1, 15),
			expectedTarget: __dirname.replace('test', '') + 'testFiles/moduleA.js',
			expectedRange: startOfDocument
		},
		b: {
			source: __dirname.replace('test', '') + 'testFiles/basic.js',
			position: new Position(2, 15),
			expectedTarget: __dirname.replace('test', '') + 'testFiles/moduleB.js',
			expectedRange: startOfDocument
		}
	};

	for (let current in tests) {
		const currentTest = tests[current];

		test(`${current} should resolve with path; ${currentTest.expectedTarget}`, () =>
			workspace.openTextDocument(currentTest.source)
				.then(document => {
					return referenceProvider.provideDefinition(document, currentTest.position).then((result) => {
						const resultOfInterest = result ? (result[0] || result) : result;

						assert.ok(Boolean(resultOfInterest));
						assert.equal(resultOfInterest.uri.path, currentTest.expectedTarget);
						assert.deepEqual(
							resultOfInterest.range,
							currentTest.expectedRange
						);
					});
				})
		);
	}
});
