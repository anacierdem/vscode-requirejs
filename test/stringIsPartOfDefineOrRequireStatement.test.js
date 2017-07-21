const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('stringIsPartOfDefineOrRequireStatement', () => {
    test('should return true for define statement', () => {
        const input = `
            define(['./module'], function (module) {
            })
        `;
        
        assert.ok(referenceProvider.stringIsPartOfDefineOrRequireStatement('./module', input));
    });

    test('should return false for define statement', () => {
        const input = `
            define(['./module'], function (module) {
                const fooBar;
            })
        `;
        
        assert.ok(!referenceProvider.stringIsPartOfDefineOrRequireStatement('fooBar', input));
    });

    test('should return true for require statement', () => {
        const input = `require('moduleC').fooBar();`;
        
        assert.ok(referenceProvider.stringIsPartOfDefineOrRequireStatement('moduleC', input));
    });

    test('should return true for multiline require statement', () => {
        const input = `
        require(['moduleA', 
            'moduleB'], function(a, b) {
        });`
        
        assert.ok(referenceProvider.stringIsPartOfDefineOrRequireStatement('moduleB', input));
    });

    test('should return false for require statement', () => {
        const input = `require('moduleC').fooBar();`;
        
        assert.ok(!referenceProvider.stringIsPartOfDefineOrRequireStatement('fooBar', input));
    });
});