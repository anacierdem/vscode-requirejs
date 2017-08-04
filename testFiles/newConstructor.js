define('myName', ['moduleA', 'moduleB'], function(a, b) {
    var foo = new a();
    foo.bar();
});