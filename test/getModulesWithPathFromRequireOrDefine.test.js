const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getModulesWithPathFromRequireOrDefine', () => {
    test('getModulesWithPathFromRequireOrDefine should return object with module path and name', () => {
        const input = `define(['./path/to/a', './path/to/b'], function (moduleA, moduleB) {`;
        const expected = {
            'moduleA': './path/to/a',
            'moduleB': './path/to/b'
        };
        
        assert.deepEqual(referenceProvider.getModulesWithPathFromRequireOrDefine(input), expected);
    });
});