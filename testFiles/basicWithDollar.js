define('myName', ['moduleA', 'moduleB'], ($, $$) => {
    var foo = $;
    var bar = $$;
    foo.baz();
    bar.prop;
});