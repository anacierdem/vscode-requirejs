require(['jsx!moduleA', 'jsx!moduleB'], function(a, b) {
    var foo = a;
    var bar = b;
    foo.baz();
    bar.prop;

    const confusingJSX = <div {() => {}}></div>
});