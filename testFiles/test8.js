require(['moduleA', 'moduleB'], function(a, b) {
    var foo = a;
    var bar = b;
    foo.baz();
    bar.prop;
});
define('myName', ['moduleA', 'moduleB'], function(a, b) {
    var foo = new a();
    foo.bar();
});
require('moduleA').foo();
define(function(require) {
    var moduleA = require('moduleA');
});