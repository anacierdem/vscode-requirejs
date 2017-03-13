# Change Log

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