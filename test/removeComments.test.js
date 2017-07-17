const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('removeComments', () => {
    test('should remove comments from text', () => {
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
});