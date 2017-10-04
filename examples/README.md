Project Examples
================

These examples demonstrate how various projects that use RequireJS can be supported by different workspace settings.

single-component
----------------

This project consists of modules, which are referenced by paths relative to the project root.

    // .vscode/settings.json
    {
        "requireModuleSupport.modulePath": "."
    }

two-components
--------------

This project consists of two components, which modules are referenced by paths pointing to their source roots. The components are built separately and have separate development pages and build scripts. This project demonstrates the main application using these components.

    // .vscode/settings.json
    {
        "requireModuleSupport.modulePath": ".",
        "requireModuleSupport.configFile": "config.js"
    }

    // config.js
    require.config({
        paths: {
            nature: 'nature/src',
            garden: 'garden/src'
        }
    });

css-plugin
----------

This project uses a RequireJS plugin, which does not need file extensions in modules, which it loads and processes - css.

    // .vscode/settings.json
    {
        "requireModuleSupport.modulePath": ".",
        "requireModuleSupport.configFile": "config.js",
        "requireModuleSupport.pluginExtensions": {
            "css": ".css"
        }
    }

    // config.js
    require.config({
        paths: {
            css: 'libraries/css'
        }
    });
