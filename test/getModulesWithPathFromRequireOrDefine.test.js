const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getModulesWithPathFromRequireOrDefine', () => {
  test('should return object with module path and name', () => {
    const input = 'define([\'./path/to/a\', \'./path/to/b\'], function (moduleA, moduleB) {';
    const expected = {
      moduleA: './path/to/a',
      moduleB: './path/to/b'
    };

    assert.deepEqual(referenceProvider.getModulesWithPathFromRequireOrDefine(input), expected);
  });

  test('should return object with module path and name for multiline define', () => {
    const input = `define([
                'moduleA', 
                'moduleB'
            ], function(a, b) {`;
    const expected = {
      a: 'moduleA',
      b: 'moduleB'
    };

    assert.deepEqual(referenceProvider.getModulesWithPathFromRequireOrDefine(input), expected);
  });

  test('should return object with module path and name for multiline define', () => {
    const input = `require([
                'moduleA', 
                'moduleB'
            ], function(a, b) {`;
    const expected = {
      a: 'moduleA',
      b: 'moduleB'
    };

    assert.deepEqual(referenceProvider.getModulesWithPathFromRequireOrDefine(input), expected);
  });

  test('should return object with module path and name for named module', () => {
    const input = 'define(\'myName\', [\'moduleA\', \'moduleB\'], function(a, b) {';
    const expected = {
      a: 'moduleA',
      b: 'moduleB'
    };

    assert.deepEqual(referenceProvider.getModulesWithPathFromRequireOrDefine(input), expected);
  });
});
