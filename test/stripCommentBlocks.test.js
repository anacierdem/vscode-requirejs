const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('stripCommentBlocks', () => {
    test('should remove all comment blocks from text', () => {
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
                const foo; // comment
                const bar; /* comment */
            })
        `;
        
        assert.equal(referenceProvider.stripCommentBlocks(input), expected);
    });
});