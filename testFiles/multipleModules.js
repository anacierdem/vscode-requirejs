require(['moduleA', 'moduleB'], function(a, b) {
    var foo = a;
    var bar = b;
    foo.baz();
    bar.prop;
});
define('myName', ['moduleC', 'moduleD'], function(c, d) {
    var foo = new d();
    foo.foo();
});
require('moduleA').foo();
define(function(require) {
    var moduleA = require('moduleB');
});