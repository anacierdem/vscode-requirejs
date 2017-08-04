const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getRequireOrDefineStatements', () => {
    test('getRequireOrDefineStatements should return statement', () => {
        const input = `
            define(['./module'], function (module) {
            })
        `;
        const expected = [{ 
            start: 1,
            contents: `            define(['./module'], function (module`
        }];
        
        assert.deepEqual(referenceProvider.getRequireOrDefineStatements(input), expected);
    });
});