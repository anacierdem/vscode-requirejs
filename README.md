# Require Module Support README

## Features

Provides goto definition functionality for require js modules.

You can navigate to the source file from locations marked with the caret (^);

    require('moduleA').foo();
                ^       ^

    require(['moduleA', 'moduleB'], function(a, b) {
                ^           ^                ^  ^
        var foo = a;
             ^    ^  
        var bar = b;
             ^    ^
        foo.baz();
          ^  ^
        bar.prop;
         ^    ^
    });

    define('myName', ['moduleA', 'moduleB'], function(a, b) {
                          ^  	     ^                ^  ^
        var foo = new a();
             ^        ^  
        foo.bar();
         ^   ^
    });

## Settings

You can set module path relative to workspace root with 

    "requireModuleSupport.modulePath" 

without leading and trailing slashes.

Example;

    {
        "requireModuleSupport.modulePath": "modules"
    }

This will translate to [WORKSPACE_ROOT]\modules

It will default to workspace root path if not given.

Another option is 

    "requireModuleSupport.onlyNavigateToFile"

When set to true, it will prevent the final search in the landing module and instead just reference the file. When this feature is left as false, the constructor or property that the goto definition operation has started with will be searched in the module file.

## Support

The project is maintained at: [gitHub](https://github.com/anacierdem/vscode-requirejs)
