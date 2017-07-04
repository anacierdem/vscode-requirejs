const assert = require('assert');
const parser = require('../parser');

suite('Parser', () => {

    test('getModulesWithPathFromRequireOrDefine should return object with module path and name', () => {
        const input = `define(['./path/to/a', './path/to/b'], function (moduleA, moduleB) {`;
        const expected = {
            'moduleA': './path/to/a',
            'moduleB': './path/to/b'
        };
        
        assert.deepEqual(parser.getModulesWithPathFromRequireOrDefine(input), expected);
    });

    test('getRequireOrDefineStatement should return statement', () => {
        const input = `
            define(['./module'], function (module) {
            })
        `;
        const expected = `define(['./module'], function (module) {`;
        
        assert.equal(parser.getRequireOrDefineStatement(input), expected);
    });

    test('removeComments should remove comments from tekst', () => {
        const input = `
            define(['./module'], function (module) {
                // require();
                /* comment */
                /**
                 * comment
                 */
            })
        `;
        const forceWhiteSpace = '';
        const expected = `
            define(['./module'], function (module) {
                ${forceWhiteSpace}
                ${forceWhiteSpace}
                ${forceWhiteSpace}
            })
        `;
        
        assert.equal(parser.removeComments(input), expected);
    });
});