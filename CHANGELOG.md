# Change Log

## [0.0.24] - 2017-20-03
### Changed

- Fixed 100% CPU usage problem.

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