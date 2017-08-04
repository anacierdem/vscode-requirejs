const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('findComments', () => {
    test('findComments should return indexes for comments', () => {
        const input = `
            define(['./module'], function (module) {
                // require();
                /* comment */
                /**
                 * comment
                 */
            })
        `;
        const expected = [
            { start: 70, end: 83 },
            { start: 100, end: 113 },
            { start: 130, end: 180 }
        ];
        
        assert.deepEqual(referenceProvider.findComments(input), expected);
    });
});