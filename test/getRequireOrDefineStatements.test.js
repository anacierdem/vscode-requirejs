const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getRequireOrDefineStatements', () => {
	test('should return array containing start and statement', () => {
		const input = `
            define(['./module'], function (module) {
            })
        `;
		const expected = [{
			start: 1,
			end: Infinity,
			contents: '            define([\'./module\'], function (module'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return define statement from one liner', () => {
		const input = 'define(function(require) { var moduleA = require(\'moduleA\'); moduleA.foo() });';
		const expected = [{
			start: 0,
			end: Infinity,
			contents: 'define(function(require'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return define statement for require arrow function', () => {
		const input = 'define(require => { });';
		const expected = [{
			start: 0,
			end: Infinity,
			contents: 'define(require => { }'
		}];


		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return define statement for module with arrow function', () => {
		const input = 'define([\'./module\'], module => { });';
		const expected = [{
			start: 0,
			end: Infinity,
			contents: 'define([\'./module\'], module => { }'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return define statement for multiple modules with arrow function', () => {
		const input = 'define([\'./module\', \'./module2\'], (module, module2) => { });';
		const expected = [{
			start: 0,
			end: Infinity,
			contents: 'define([\'./module\', \'./module2\'], (module, module2'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return define statement for multiline modules definition', () => {
		const input = `
            define([
                'moduleA', 
                'moduleB'
            ], function(a, b) {
                var foo = a;
                var bar = b;
            });
        `;
		const expected = [{
			start: 1,
			end: Infinity,
			contents: `            define([
                'moduleA', 
                'moduleB'
            ], function(a, b`
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return define statement for named module', () => {
		const input = `
            define('myName', ['moduleA', 'moduleB'], function(a, b) {
            });
        `;
		const expected = [{
			start: 1,
			end: Infinity,
			contents: '            define(\'myName\', [\'moduleA\', \'moduleB\'], function(a, b'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});


	test('should return require statement', () => {
		const input = `
            require(['moduleA', 'moduleB'], function(a, b) {
            });
        `;
		const expected = [{
			start: 1,
			end: Infinity,
			contents: '            require([\'moduleA\', \'moduleB\'], function(a, b'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return require statement for multiple modules with arrow function', () => {
		const input = `
            require(['moduleA', 'moduleB'], (a, b) => {
            });
        `;
		const expected = [{
			start: 1,
			end: Infinity,
			contents: '            require([\'moduleA\', \'moduleB\'], (a, b'
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	test('should return require statement for multiline modules definition', () => {
		const input = `
            require(['moduleA', 
                        'moduleB'], function(a, b) {
                var foo = a;
                var bar = b;
            });
        `;
		const expected = [{
			start: 1,
			end: Infinity,
			contents: `            require(['moduleA', 
                        'moduleB'], function(a, b`
		}];

		assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
	});

	// TODO: Add tests for multiple require/define cases
});
