const assert = require('assert');
const { workspace, Position } = require('vscode');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

// Integration tests
suite('referenceProvider basic.js', () => {
	const files = {
		basic: __dirname.replace('test', '') + 'testFiles/basic.js',
		ifStatement: __dirname.replace('test', '') + 'testFiles/ifStatement.js',
		ifStatementWithProperty: __dirname.replace('test', '') + 'testFiles/ifStatementWithProperty.js',
		basicArrow: __dirname.replace('test', '') + 'testFiles/basicArrow.js',
		basicMultiline: __dirname.replace('test', '') + 'testFiles/basicMultiline.js',
		basicMultilineWithComment: __dirname.replace('test', '') + 'testFiles/basicMultilineWithComment.js',
		immediatelyInvoked: __dirname.replace('test', '') + 'testFiles/immediatelyInvoked.js',
		confusingComments: __dirname.replace('test', '') + 'testFiles/confusingComments.js',
		inlineRequire: __dirname.replace('test', '') + 'testFiles/inlineRequire.js',
		moduleA: __dirname.replace('test', '') + 'testFiles/moduleA.js',
		moduleB: __dirname.replace('test', '') + 'testFiles/moduleB.js'
	};

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

	const fooRange = {
		_end: {
			_character: 8,
			_line: 2
		},
		_start: {
			_character: 8,
			_line: 2
		}
	};

	const targets = {
		moduleA: {
			expectedTarget: files.moduleA,
			expectedRange: startOfDocument
		},
		moduleB: {
			expectedTarget: files.moduleB,
			expectedRange: startOfDocument
		},
		bazToA: {
			expectedTarget: files.moduleA,
			expectedRange: bazRange
		},
		fooToA: {
			expectedTarget: files.moduleA,
			expectedRange: startOfDocument
		},
		fooToB: {
			expectedTarget: files.moduleB,
			expectedRange: startOfDocument
		},
		fooToARange: {
			expectedTarget: files.moduleA,
			expectedRange: fooRange
		},
		barToB: {
			expectedTarget: files.moduleB,
			expectedRange: startOfDocument
		},
		propToA: {
			expectedTarget: null,
			expectedRange: startOfDocument
		},
		propToB: {
			expectedTarget: files.moduleB,
			expectedRange: propRange
		},
		a: {
			expectedTarget: files.moduleA,
			expectedRange: startOfDocument
		},
		b: {
			expectedTarget: files.moduleB,
			expectedRange: startOfDocument
		}
	};

	const tests = {
		basic: {
			moduleA: [new Position(0, 14), new Position(3, 11), new Position(1, 15), new Position(3, 6)],
			moduleB: [new Position(0, 24), new Position(2, 15), new Position(4, 6)],
			propToB: new Position(4, 11)
		},
		// basicArrow: {
		// 	moduleA: new Position(0, 14),
		// 	bazToA: new Position(2, 9),
		// 	propToA: new Position(3, 11),
		// 	a: new Position(1, 15),
		// 	fooToA: new Position(2, 5)
		// },
		// basicMultiline: {
		// 	moduleA: new Position(0, 15),
		// 	moduleB: new Position(1, 15),
		// 	fooToA: new Position(4, 5),
		// 	bazToA: new Position(4, 10),
		// 	barToB: new Position(5, 5),
		// 	propToB: new Position(5, 10)
		// },
		// basicMultilineWithComment: {
		// 	moduleA: new Position(0, 15),
		// 	moduleB: new Position(1, 15),
		// 	fooToA: new Position(4, 5),
		// 	bazToA: new Position(4, 10),
		// 	barToB: new Position(5, 5),
		// 	propToB: new Position(5, 10)
		// },
		// confusingComments: {
		// 	moduleB: new Position(5, 9),
		// 	fooToB: new Position(9, 5),
		// 	propToB: new Position(9, 10)
		// },
		// ifStatement: {
		// 	moduleA: new Position(0, 14),
		// 	moduleB: new Position(0, 24),
		// 	bazToA: new Position(3, 11),
		// 	propToB: new Position(4, 11),
		// 	a: new Position(1, 15),
		// 	b: new Position(2, 15),
		// 	barToB: new Position(4, 6),
		// 	fooToA: new Position(3, 6)
		// },
		// ifStatementWithProperty: {
		// 	moduleA: new Position(0, 14),
		// 	moduleB: new Position(0, 24),
		// 	bazToA: new Position(3, 11),
		// 	propToB: new Position(4, 11),
		// 	a: new Position(1, 15),
		// 	b: new Position(2, 15),
		// 	barToB: new Position(4, 6),
		// 	fooToA: new Position(3, 6)
		// },
		// immediatelyInvoked: {
		// 	// moduleA: new Position(0, 12), // TODO: should fix this case
		// 	fooToARange: new Position(0, 21)
		// },
		// inlineRequire: {
		// 	moduleA: new Position(1, 12),
		// 	moduleA: new Position(1, 30),
		// },
	};

	for (let currentTestName in tests) {
		const currentTest = tests[currentTestName];

		for (let currentPositionName in currentTest) {
			const currentPositions = currentTest[currentPositionName];

			for (let currentTestPositionIndex in currentTest) {
				const currentPosition = currentPositions[currentTestPositionIndex];
				const expectedTarget = targets[currentPositionName].expectedTarget;

				test(`${currentPositionName} in ${currentTestName} should ${expectedTarget ? `resolve with path; ${expectedTarget}` : 'not resolve'}`, () =>
					workspace.openTextDocument(files[currentTestName])
						.then(document => {
							return referenceProvider.provideDefinition(document, currentPosition).then((result) => {
								const haveResult = Array.isArray(result) ? result.length : Boolean(result);

								assert.ok(expectedTarget ? haveResult : !haveResult);

								if (haveResult) {
									const resultOfInterest = Array.isArray(result) ? result[0] : result;

									assert.equal(resultOfInterest.uri.path, expectedTarget);
									assert.deepEqual(
										resultOfInterest.range,
										targets[currentPositionName].expectedRange
									);
								}
							});
						})
				);
			}
		}
	}
});
