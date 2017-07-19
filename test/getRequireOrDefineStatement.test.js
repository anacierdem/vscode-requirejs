const assert = require('assert');
const { ReferenceProvider } = require('../extension');
const referenceProvider = new ReferenceProvider();

suite('getRequireOrDefineStatement', () => {
    test('should return define statement', () => {
        const input = `
            define(['./module'], function (module) {
            })
        `;
        const expected = `define(['./module'],function(module){`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return define statement from one liner', () => {
        const input = `define(function(require) { var moduleA = require('moduleA'); moduleA.foo() });`;
        const expected = `define(function(require){`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return define statement for require arrow function', () => {
        const input = `define(require => { });`;
        const expected = `define(require=>{`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return define statement for module with arrow function', () => {
        const input = `define(['./module'], module => { });`;
        const expected = `define(['./module'],module=>{`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return define statement for multiple modules with arrow function', () => {
        const input = `define(['./module', './module2'], (module, module2) => { });`;
        const expected = `define(['./module','./module2'],(module,module2)=>{`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return define statement for multiline modules definition', () => {
        const input = `
            define([
                'moduleA', 
                'moduleB'
            ], function(a, b) {
                var foo = a;
                var bar = b;
            });
        `;
        const expected = `define(['moduleA','moduleB'],function(a,b){`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    }); 

    test('should return define statement for named module', () => {
        const input = `
            define('myName', ['moduleA', 'moduleB'], function(a, b) {
            });
        `;
        const expected = `define('myName',['moduleA','moduleB'],function(a,b){`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    }); 


    test('should return require statement', () => {
        const input = `
            require(['moduleA', 'moduleB'], function(a, b) {
            });
        `;
        const expected = `require(['moduleA','moduleB'],function(a,b){`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return require statement for multiple modules with arrow function', () => {
        const input = `
            require(['moduleA', 'moduleB'], (a, b) => {
            });
        `;
        const expected = `require(['moduleA','moduleB'],(a,b)=>{`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });

    test('should return require statement for multiline modules definition', () => {
        const input = `
            require(['moduleA', 
                        'moduleB'], function(a, b) {
                var foo = a;
                var bar = b;
            });
        `;
        const expected = `require(['moduleA','moduleB'],function(a,b){`;
        
        assert.equal(referenceProvider.getRequireOrDefineStatement(input), expected);
    });    
});