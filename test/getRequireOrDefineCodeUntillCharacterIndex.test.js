const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getRequireOrDefineCodeUntillCharacterIndex', () => {
    test('should return end off string until last occurance of define', () => {
        const document = {
            getText() {
                return `
                    require(['./moduleA'], function (moduleA) {
                    })

                    define(['./moduleB'], function (moduleB) {
                        const b = moduleB;`;
            }
        };
        const expected = `define(['./moduleB'], function (moduleB) {
                        const b = moduleB;`;
        
        assert.equal(referenceProvider.getRequireOrDefineCodeUntillCharacterIndex(document, 0, 0), expected);
    });

    test('should return end off string until last occurance of require', () => {
        const document = {
            getText() {
                return `
                    define(['./moduleA'], function (moduleA) {
                    }) 
                    require(['moduleA', 'moduleB'], function(a, b) {
                        var foo = a;`;
            }
        };
        const expected = `require(['moduleA', 'moduleB'], function(a, b) {
                        var foo = a;`;
        
        assert.equal(referenceProvider.getRequireOrDefineCodeUntillCharacterIndex(document, 0, 0), expected);
    });
});