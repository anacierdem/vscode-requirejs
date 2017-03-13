# Require Module Support README

## Features

Provides goto definition functionality for require js modules.

You can set module path relative to workspace root with "requireModuleSupport.modulePath" without leading and trailing slashes.

Example for a Windows based system;

{
    "requireModuleSupport.modulePath": "modules"
}

This will translate to [WORKSPACE_ROOT]\modules

It will default to workspace root path if not given.


## Support

The project is maintained at: [gitHub](https://github.com/anacierdem/vscode-requirejs)