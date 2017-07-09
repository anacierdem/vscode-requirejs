const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('ReferenceProvider', () => {

    test('getModulesWithPathFromRequireOrDefine should return object with module path and name', () => {
        const input = `define(['./path/to/a', './path/to/b'], function (moduleA, moduleB) {`;
        const expected = {
            'moduleA': './path/to/a',
            'moduleB': './path/to/b'
        };
        
        assert.deepEqual(referenceProvider.getModulesWithPathFromRequireOrDefine(input), expected);
    });

    test('getRequireOrDefineStatement should return statement', () => {
        const input = `
            define(['./module'], function (module) {
            })
        `;
        const expected = `define(['./module'], function (module`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('removeComments should remove comments from text', () => {
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
        
        assert.equal(referenceProvider.removeComments(input), expected);
    });

    test('doBackwardsSearch returns offset of character - 1 if character at offset equals searchFor', () => {
        const input = 'foo.baz();';
        const input2 = `require('moduleA').foo();`;
        const expected = 2;
        const expected2 = 16;

        //                    foo.baz();
        // Starts searching from ^
        assert.equal(referenceProvider.doBackwardsSearch(input, 3, '.'), expected);

        //     require('moduleA').foo();
        // Starts searching from ^
        assert.equal(referenceProvider.doBackwardsSearch(input2, 17, ')'), expected2);
    });

    test('doBackwardsSearch returns false if next character does not equal searchFor', () => {
        const input = `define(require => {
                           var moduleB = require('moduleB');
                       });`
        const expected = false;

        //         var moduleB = require('moduleB');
        // Starts searching from ^
        assert.equal(referenceProvider.doBackwardsSearch(input, 61, ')'), expected);
    });

    test('doBackwardsSearch ignores whitespace, tab, newline and carriage return', () => {
        const space = ' ';
        const tab = `   `;
        const newline = "\n";
        const carriageReturn = "\r";
        const input = `.${space}${tab}${newline}${carriageReturn}`;
        const expected = -1;

        assert.equal(referenceProvider.doBackwardsSearch(input, input.length-1, '.'), expected);
    });
});