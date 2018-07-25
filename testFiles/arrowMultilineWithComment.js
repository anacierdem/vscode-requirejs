require(['moduleA', // first module 
            'moduleB'], (a, b) => {
    var foo = a;
    var bar = b;
    foo.baz();
    bar.prop;
});
