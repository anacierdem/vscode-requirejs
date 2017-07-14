const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getRequireOrDefineStatement', () => {
    test('getRequireOrDefineStatement should return statement', () => {
        const input = `
            define(['./module'], function (module) {
            })
        `;
        const expected = `define(['./module'], function (module) {`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });
});