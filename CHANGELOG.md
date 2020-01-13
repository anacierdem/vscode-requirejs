# Change Log

## [0.1.33] - 2020-13-01

### Changed

- Updated dependencies.
- Updated readme.

## [0.1.32] - 2019-14-10

### Changed

- Updated dependencies and tests.

## [0.1.31] - 2019-22-07

### Changed

- Updated development dependencies.

## [0.1.29] - 2019-19-07

### Changed

- Updated dependencies.

## [0.1.28] - 2019-27-06

### Changed

- Now supporting double quoted strings in module names.

## [0.1.25] - 2019-29-04

### Changed

- Fixed extension not working when there are \_ or \$ in function parameters.

## [0.1.24] - 2019-29-04

### Changed

- Fixed extension not working when there is a trailing comma.

## [0.1.23] - 2019-12-01

### Changed

- Fixed a bug causing developer console error.

## [0.1.21] - 2019-03-01

### Changed

- Disabled unsafe autocompletion.

## [0.1.20] - 2018-31-12

### Updated

- Updated readme to match JSX functionality.

## [0.1.19] - 2018-28-12

### Added

- jsx file support.

## [0.1.18] - 2018-14-09

### Added

- Commandline installation instructions.

## [0.1.15] - 2018-06-08

### Added

- Implemented a crude autocompletion.

## [0.1.14] - 2018-30-07

### Changed

- Updated dependencies.

## [0.1.13] - 2018-25-07

### Added

- Added support for require/define arrow function callbacks.
- Did minor performance improvements.

## [0.1.11] - 2018-06-04

### Added

- Added support for customizing require/define function names. Special thanks to [DaBs](https://github.com/DaBs)

## [0.1.10] - 2018-29-03

### Changed

- Updated dependencies.

## [0.1.9] - 2017-22-12

### Added

- Added support for comments in require dependency list. Special thanks to [prantlf](https://github.com/prantlf)
- Fixed problem navigating to an inline require statement's module.

## [0.1.7] - 2017-21-12

### Added

- Added RequireJS config file support. Special thanks to [prantlf](https://github.com/prantlf)

## [0.1.6] - 2017-29-08

### Changed

- Added patreon URL

## [0.1.4] - 2017-15-08

### Changed

- Fixed a bug causing definition navigation.
- Improved constructor search. It was previously matching partial words and was not case sensitive resulting in inifinite loops.

## [0.1.2] - 2017-14-08

### Changed

- Fixed a bug causing 100% CPU usage when trying to navigate on a property assigned the the main object such as `el = el.offsetParent`.

## [0.1.1] - 2017-07-08

### Changed

- Now, the extension only runs for JavaScript files.

## [0.1.0] - 2017-05-08

### Added

- Added support for multiple require/define statements in a single file.
- This version covers all important use cases.

## [0.0.33] - 2017-20-07

### Changed

- CommonJS style requires inside the requireJS blocks are now supported.

        define(function(require) {
            var moduleB = require('moduleB');
            moduleB.prop;
        });

## [0.0.32] - 2017-06-07

### Changed

- Fixed a bug causing navigation error when the variable name includes the constructor name.

## [0.0.31] - 2017-05-07

### Changed

- Fixed potential run-time error sources.

## [0.0.30] - 2017-18-06

### Added

- Handle relative paths and unknown modules.

## [0.0.29] - 2017-26-05

### Added

- Multiline statement and space support added.

## [0.0.28] - 2017-20-03

### Changed

- Fixed 100% CPU usage problem.
- Resolved a console error.
- Fixed bugs preventing the last search on target module.

## [0.0.23] - 2017-15-03

### Changed

- Changed logo for larger display.

## [0.0.21] - 2017-14-03

### Changed

- Can navigate to modules via strings in module name list.

## [0.0.20] - 2017-14-03

### Changed

- Imported module does not have to be used with new keyword anymore.
- Simple comments does not interfere with definition navigation.
- Fixed a problem causing navigation error in some cases.

### Added

- New setting (onlyNavigateToFile) to decide whether to do a final search on the landing page.

## [0.0.18] - 2017-13-03

### Changed

- Module path is now set relative to workspace root with "requireModuleSupport.modulePath" without leading and trailing slashes. This also fixed OS path separator related issues.
- Fixed an undefined position causing runtime error.

## [0.0.16] - 2017-13-03

### Changed

- User is warned when there is not a found definition.

## [0.0.15] - 2017-13-03

### Changed

- Removed code eval.
- Fixed multiline module name / function argument list problem.

### Added

- Added support for directly used require statements such as require('...').use()
- Added support for modules not having a name.

## [0.0.11] - 2017-28-02

### Changed

- Added repository field & reference to github.
- Activate extension only for js files.

## [0.0.10] - 2017-17-02

### Changed

- Changed description.

## [0.0.9] - 2017-16-02

### Changed

- Fixed a bug when a module dependency is used without being defined in function arguments.

## [0.0.8] - 2017-16-02

### Added

- Better instantiation support.
