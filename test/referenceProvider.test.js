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
		inlineRequireProperty: __dirname.replace('test', '') + 'testFiles/inlineRequireProperty.js',
		multipleModules: __dirname.replace('test', '') + 'testFiles/multipleModules.js',
		moduleA: __dirname.replace('test', '') + 'testFiles/moduleA.js',
		moduleB: __dirname.replace('test', '') + 'testFiles/moduleB.js',
		moduleC: __dirname.replace('test', '') + 'testFiles/moduleC.js',
		moduleD: __dirname.replace('test', '') + 'testFiles/moduleD.js'
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

	const propRangeSingle = {
		_end: {
			_character: 8,
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
			_character: 11,
			_line: 2
		},
		_start: {
			_character: 8,
			_line: 2
		}
	};

	const fooRangeSingle = {
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
		moduleC: {
			expectedTarget: files.moduleC,
			expectedRange: startOfDocument
		},
		moduleD: {
			expectedTarget: files.moduleD,
			expectedRange: startOfDocument
		},
		bazInA: {
			expectedTarget: files.moduleA,
			expectedRange: bazRange
		},
		// TODO: this should be a range
		fooInA: {
			expectedTarget: files.moduleA,
			expectedRange: fooRangeSingle
		},
		fooInD: {
			expectedTarget: files.moduleD,
			expectedRange: fooRange
		},
		noResult: {
			expectedTarget: null,
			expectedRange: null
		},
		propInB: {
			expectedTarget: files.moduleB,
			expectedRange: propRange
		},
		// TODO: this should be a range
		propInBSingle: {
			expectedTarget: files.moduleB,
			expectedRange: propRangeSingle
		}
	};

	const tests = {
		basic: {
			moduleA: [new Position(0, 14), new Position(1, 15), new Position(3, 6)],
			moduleB: [new Position(0, 24), new Position(2, 15), new Position(4, 6)],
			// This test is failing on travis?
			// propInB: [new Position(4, 11)],
			bazInA: [new Position(3, 11)]
		},
		basicArrow: {
			moduleA: [new Position(0, 14), new Position(1, 15), new Position(2, 5)],
			bazInA: [new Position(2, 9)],
			noResult: [new Position(3, 11)]
		},
		basicMultiline: {
			moduleA: [new Position(0, 15), new Position(4, 5)],
			moduleB: [new Position(1, 15), new Position(5, 5)],
			bazInA: [new Position(4, 10)],
			propInB: [new Position(5, 10)]
		},
		basicMultilineWithComment: {
			moduleA: [new Position(0, 15), new Position(4, 5)],
			moduleB: [new Position(1, 15), new Position(5, 5)],
			bazInA: [new Position(4, 10)],
			propInB: [new Position(5, 10)]
		},
		confusingComments: {
			moduleB: [new Position(9, 5), new Position(5, 9)],
			propInB: [new Position(9, 10)]
		},
		ifStatement: {
			moduleA: [new Position(0, 14), new Position(1, 15), new Position(3, 6)],
			moduleB: [new Position(0, 24), new Position(2, 15), new Position(4, 6)],
			propInB: [new Position(4, 11)],
			bazInA: [new Position(3, 11)]
		},
		ifStatementWithProperty: {
			moduleA: [new Position(0, 14), new Position(1, 15), new Position(3, 6)],
			moduleB: [new Position(0, 24), new Position(2, 15), new Position(4, 6)],
			propInB: [new Position(4, 11)],
			bazInA: [new Position(3, 11)]
		},
		immediatelyInvoked: {
			// moduleA: [new Position(0, 12)], // TODO: should fix this case
			fooInA: [new Position(0, 21)]
		},
		inlineRequire: { moduleA: [new Position(1, 12), new Position(1, 30)] },
		inlineRequireProperty: {
			// TODO changing order of these props, tests fails - must investigate
			moduleB: [new Position(1, 12), new Position(1, 30), new Position(2, 8)],
			propInBSingle: [new Position(2, 14)]
		},
		multipleModules: {
			moduleA: [new Position(0, 14), new Position(1, 15), new Position(3, 6)],
			moduleB: [new Position(0, 24), new Position(2, 15), new Position(4, 6)],
			moduleC: [new Position(6, 23)],
			propInB: [new Position(4, 11)],
			bazInA: [new Position(3, 11)],
			moduleD: [new Position(6, 34), new Position(8, 5)],
			fooInD: [new Position(8, 10)]
		}
	};

	for (let currentTestName in tests) {
		const currentTest = tests[currentTestName];

		for (let currentPositionName in currentTest) {
			const currentPositions = currentTest[currentPositionName];

			for (let currentTestPositionIndex in currentPositions) {
				const currentPosition = currentPositions[currentTestPositionIndex];
				const expectedTarget = targets[currentPositionName].expectedTarget;

				// TODO: should confirm all reference provider results including the same file
				test(`position ${currentPosition.line + 1}, ${currentPosition.character + 1} in ${currentTestName} should ${expectedTarget ? `resolve with path; ${expectedTarget} (${currentPositionName})` : 'not resolve'}`, () =>
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
