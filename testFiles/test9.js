// define(['...'], function(foo) {
//     var bar = foo;
// }
// );
define([
    'bar'
], function (bar) {
    var foo = bar;

    foo.property //Above foo in comments blocking navigation.
});
