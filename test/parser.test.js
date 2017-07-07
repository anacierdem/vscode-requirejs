const assert = require('assert');
const parser = require('../parser');

suite('Parser', () => {

    test('getModulesWithPathFromRequireOrDefine should return object with module path and name', () => {
        const input = `define(['./path/to/a', './path/to/b'], function (moduleA, moduleB`;
        const expected = {
            'moduleA': './path/to/a',
            'moduleB': './path/to/b'
        };
        
        assert.deepEqual(parser.getModulesWithPathFromRequireOrDefine(input), expected);
    });

    test('getRequireOrDefineStatement should return statement', () => {
        const input = `
            define(function () {
            })
        `;
        const expected = 'define(function (';
        
        assert.equal(parser.getRequireOrDefineStatement(input), expected);
    });

    test('removeComments should remove comments from tekst', () => {
        const input = `
            define(function () {
                // require();
                /* comment */
                /**
                 * comment
                 */
            })
        `;
        const whitespace = '';
        const expected = `
            define(function () {
                ${whitespace}
                ${whitespace}
                ${whitespace}
            })
        `;
        
        assert.equal(parser.removeComments(input), expected);
    });
});