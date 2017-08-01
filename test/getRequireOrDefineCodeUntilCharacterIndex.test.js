const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getRequireOrDefineCodeUntilCharacterIndex', () => {
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
        
        assert.equal(referenceProvider.getRequireOrDefineCodeUntilCharacterIndex(document, 0, 0), expected);
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
        
        assert.equal(referenceProvider.getRequireOrDefineCodeUntilCharacterIndex(document, 0, 0), expected);
    });

    test('should return end off string until define for anonymous module', () => {
        const document = {
            getText() {
                return `
                    define(function(require) {
                        var moduleA`;
            }
        };
        const expected = `define(function(require) {
                        var moduleA`;
        
        assert.equal(referenceProvider.getRequireOrDefineCodeUntilCharacterIndex(document, 0, 0), expected);
    });

});