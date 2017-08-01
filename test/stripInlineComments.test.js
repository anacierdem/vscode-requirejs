const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('stripInlineComments', () => {
    test('should remove all inline comments from text', () => {
        const input = `
            define(['./module'], function (module) {
                // require();
                /* comment */
                /**
                 * comment
                 */
                const foo; // comment
                const bar; /* comment */
            })
        `;
        const expected = `
            define(['./module'], function (module) {
                // require();
                /* comment */
                /**
                 * comment
                 */
                const foo; 
                const bar; 
            })
        `;
        
        assert.equal(referenceProvider.stripInlineComments(input), expected);
    });
});