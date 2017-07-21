const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('stringHasMultipleDefineOrRequireStatements', () => {
    test('should return true', () => {
        const string = `
        define('myName', ['moduleA', 'moduleB'], function(a, b) {
            var foo = new a();
            foo.bar();
        });
        require('moduleA').foo();
        `;

        assert.ok(referenceProvider.stringHasMultipleDefineOrRequireStatements(string));
    });

    test('should return false', () => {
        const string = `
        define('myName', ['moduleA', 'moduleB'], function(a, b) {
            var require, define;
        });
        `;

        assert.ok(!referenceProvider.stringHasMultipleDefineOrRequireStatements(string));
    });

    test('should return false for anonymous define module', () => {
        const string = `
            define(function(require) {
                var moduleA = require('moduleA');
            });
        `;

         assert.ok(!referenceProvider.stringHasMultipleDefineOrRequireStatements(string));
    })

});