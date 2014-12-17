## 0.1.0

### prerelease 17
 * Bug fix - repo path not passed when building specific project
 * Clean up error messages
 * Add name to project during initialization
 * Build all projects despite individual failures

### prerelease 12
 * Bug fixes around handling exceptions
 * Better test coverage and addition of istanbul to gulpfile

### prerelease 10
 * Skip packing step when configuration is missing
 * Remove vinyl in favor of globulesce (a faster way to search for build files).
 * Pull out step runner into a new library - [drudgeon](https://github.com/LeanKit-Labs/drudgeon)

### prerelease 7
 * Improve how build files get searched for. Consult you a [Doug Neiner](https://github.com/dcneiner) for great good! 
 * Add ability to persist build data as JSON or YAML formatted file.

### prerelease 6
Add missing dependency to the package.json file.

### prerelease 5
Add a nopack feature to allow building without creating a package. Added for the CLI to make it easy to test a build's validity w/o having to overwrite the package each time you test.

### prerelease 4
NPM wouldn't allow -3 to be published :rage1: (even a force failed). Bumped the version.

### prerelease 3
Support a call to check for the existence of a valid build file in the repository.

### prerelease 2
Support building a single project by name.