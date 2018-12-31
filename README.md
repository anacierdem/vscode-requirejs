# Require Module Support README

[![Build Status](https://api.travis-ci.org/anacierdem/vscode-requirejs.svg?branch=master)](https://travis-ci.org/anacierdem/vscode-requirejs)
[![JavaScript Style Guide: Good Parts](https://img.shields.io/badge/code%20style-goodparts-brightgreen.svg?style=flat)](https://github.com/dwyl/goodparts "JavaScript The Good Parts")
[![codecov](https://codecov.io/gh/anacierdem/vscode-requirejs/branch/master/graph/badge.svg)](https://codecov.io/gh/anacierdem/vscode-requirejs)
[![dependencies Status](https://david-dm.org/anacierdem/vscode-requirejs/status.svg)](https://david-dm.org/anacierdem/vscode-requirejs)
[![devDependencies Status](https://david-dm.org/anacierdem/vscode-requirejs/dev-status.svg)](https://david-dm.org/anacierdem/vscode-requirejs?type=dev)

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

This will translate to `[WORKSPACE_ROOT]\modules`

It will default to workspace root path if not given.
You can also use relative paths on require/define calls.

Another option is;

    "requireModuleSupport.onlyNavigateToFile"

When set to true, it will prevent the final search in the landing module and instead just reference the file. When this feature is left as false, the constructor or property that the goto definition operation has started with will be searched in the module file.

If you use a dedicated RequireJS configuration file, which specified paths to sub-components or plugins, you can load it to help the module path resolution:

    "requireModuleSupport.configFile"

The value of `requireModuleSupport.modulePath` will be used as `baseUrl` then.

Example:

    "requireModuleSupport.configFile": "config.js"

This will evaluate the file `[WORKSPACE_ROOT]\config.js` with `require = requirejs`.

If you use RequireJS plugins in your projects, which do not require appending file extensions to their target modules, you will need to supply these extensions too:

    "requireModuleSupport.pluginExtensions"

Example:

    "requireModuleSupport.pluginExtensions": {
        "css": ".css"
    }

This will ensure, that a module reference like "css!views/panel" will be handled as "css!views/panel.css" before resolving the actual module path.

If you for some reason are using custom `define` and `require` names, those can be configured with

    "requireModuleSupport.requireName": "requireCustomName",
    "requireModuleSupport.defineName": "defineCustomName"

And this will resolve correctly.

### RequireJS Config Files

RequireJS configuration properties like `paths`, `bundles` and `config` are usually maintained in a separate file in a single `require.config()` statement. This file can be evaluated, when the project is loaded on debug pages, when the project is built (for root components) and in other situations - like this editor plugin.

Example:

    // config.js
    require.config({
        paths: {
            ui: 'ui/src', // The "ui" component is located elsewere.
            css: 'libraries/css' // A shortcut for the full module path.
        }
    });

    // main.js
    require(['ui/views/panel'], function (Panel) {
        const panel = new Panel();
        document.body.appendChild(panel.el);
    });

    // ui/src/views/panel.js
    define(['css!./panel'], function () {
        function Panel () {
            this.el = ...;
        }
        return Panel;
    });

    // ui/src/views/panel.css
    .panel {
        ...
    }

### JSX support

You can use the completion system with JSX files as well. You just need to set `pluginExtensions` option properly and import your JSX files like `jsx!/src/moduleA`. Example `requireModuleSupport.pluginExtensions`;

    "requireModuleSupport.pluginExtensions": {
        jsx: ".jsx"
    }

You can change object keys as you see fit.

## Installation

run;

    code --install-extension lici.require-js

in your command line, assuming vscode is installed and registered in your path.

## Support

The project is maintained at: [gitHub](https://github.com/anacierdem/vscode-requirejs)

Support this project at http://patreon.com/anacierdem
