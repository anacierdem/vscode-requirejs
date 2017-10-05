require(['moduleA', // first module 
            'moduleB'], function(a, b) {
    var foo = a;
    var bar = b;
    foo.baz();
    bar.prop;
});
