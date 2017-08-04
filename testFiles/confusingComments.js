// define(['...'], function(foo) {
//     var bar = foo;
// }
// );
define([
    'moduleB'
], function (bar) {
    var foo = bar;

    foo.prop //Above foo in comments blocking navigation.
});
