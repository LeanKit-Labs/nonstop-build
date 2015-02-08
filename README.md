## nonstop-build
Library for producing packages from nonstop build files.

## Approach
Nonstop supports 1 or more projects per repository. The build file should specify all projects, their build steps and other metadata that nonstop will use to create the package.

nonstop builds each project based on a set of user defined and implemented steps. Steps are executed via the shell in order. This approach will support _any_ language and works well with other build tools. The only requirement is that if a build step fails, it should exit with a code other than 0.

  Note: build tools that fail with an exit code of 0 are bad and should feel bad.

## API
While there are several modules in this library, consumers will only interact with one method:

### hasBuildFile( workingDirectory )
Returns a promise that will resolve to true or false to indicate whether or not a build file was found in the workingDirectory (usually the top-level folder in the git repository). If the working directory is invalid, an error will be thrown instead which you can detect by using a `.catch()`.

```javascript
// workingDirectory can either be a path to the repository or metadata about it
build.hasBuildFile( '/path/to/repo' )
  .then( function( result ) {
    // result will be true if the file exists, false if it is missing or invalid
  } )
  .catch( function( err ) {
    // this callback is invoked if the working path is invalid
  } );
```

### start( repository, [projectName], [skipPacking] )
Start the build for all eligible projects defined in the build file. Returns a promise that resolves to an array of packageInformation for each successful build. You can optionally provide a `projectName` to limit the build to a specific project. You can also provide an optional `true` argument to cause this to skip the packaging step. (primarily for use in testing build via the cli)

```javascript
// repository - either the path to the git repository or metadata about the repository
build.start( '/path/to/repo' )
  .then( function( results ) {
    // the results array should contain a packageInfo for every successfully built project
    // defined in the build file
  } );
```

## Build File
Each repository should have a single build file in either JSON or YAML format. The build file should be named `nonstop.json` or `nonstop.yaml`. (If you like, you can prefix the file name with a dot)

A build file consists of the following sections:

 * Platforms - controls which platforms and architectures the build is valid for
 * Projects - a list of projects, their build steps and other information

### Platforms
The platforms section allows you to specify which platforms a build is valid on. This means that agents running on platforms that match the filters will produce a build. Omitting this block altogether means ever build agent will attempt to run the build.

platforms:

 * `'darwin'` (OSX)
 * `'linux'`
 * `'win32'` (Windows)

architectures:

 * `'x64'`
 * `'x86'`

### Project
Each project can contain the following metadata:

  * path - working path
  * versionFile - (optional) specify the path to the file containing the project's version
  * steps - the build steps to execute
  * pack - specify the files to include in the package archive
  * reports - folders containing static output from the build

#### Path
This property sets the top-level working directory that all other paths (specified in steps, patterns and reports) will be relative to.

#### VersionFile
If you follow common conventions, nonstop __should__ be able to locate the file a supported language is using to specify the version. In Node, the package.json file sits at the root of the project. In Erlang, an .app.src file is generally included at the top of the `src` folder. In .Net, nonstop will search a few locations for an AssemblyInfo.cs file. If you've put the assembly attributes in another file, you should use this setting to specify the relative path to that file.

> __!IMPORTANT!__ - you must keep the name and location of the version file consistent throughout the entire life of the repository. Changing this will break nonstop's ability to read the version for each commit and determine the version history.

#### Steps
Each build step is a set of parameters that nonstop will use to execute the step in the shell.

 * path - the path (relative to the project's path) where the command should be executed
 * command - the command to issue
 * arguments - an array of arguments to pass to the command
 * platform - (optional) specify which platform(s) this step should execute on

Each step is expected to exit with a code of 0 on success and a non-zero number if the step failed. If you must use a tool that does not behave correctly, wrap it in a script that will emit the correct exit code.

In some cases, you may need a step that only executes on a specific platform. In this event, you should add the `platform` property with the platform name (or an array of names) that the step is valid for. This would allow you to build a C# project with .Net on Windows and Mono on OSX and Linux.

#### Pack
The pack property allows you to set a pattern as a comma delimited string or array comprised of globs that nonstop will evaluate (relative to the project's path) in order to determine which files should be included in the package's archive.

#### Reports
A hash where the key is the report name you want to assign and the value is the relative path to the folder containing report output. This allows nonstop's build agent to preserve reports associated with a particular commit's build. The most likely use case for this is code quality or test coverage reports so that you can track these things over time on a per-project basis.

### JSON Example

In this example, the build is only valid on 64 bit darwin or linux OSs. There is a single project named 'project1' with 4 build steps named 'npm', 'plato', 'test' and 'clientTest'. The path for the project sets the relative path for all other paths. The pack pattern controls which files will be included in the archive that gets produced. Finally, the reports section defines folders where static files were generated that should be made available (used by the agent's HTTP host to share these reports).

```json
{
  "platforms": {
    "darwin": {
      "architecture": [ "x64" ]
    }
    "linux": {
      "architecture": [ "x64" ]
    }
  },
  "projects": {
    "project1": {
      "path": "./project1"
      "steps": {
        "npm": {
          "path": "./",
          "command": "npm",
          "arguments": [ "install" ]
        },
        "test": {
          "path": "./",
          "command": "gulp",
          "arguments": [ "test" ]
        }
      },
      "pack": {
        "pattern": "./node_modules/**,./src/**"
      },
      "reports": {
        "plato": "./plato"
        "clientTests": "./clientTests"
      }
    }
  }
```

### YAML Example

In this example, the build is only valid on 64 bit darwin or linux OSs. There is a single project named 'project1' with 4 build steps named 'npm', 'plato', 'test' and 'clientTest'. The path for the project sets the relative path for all other paths. The pack pattern controls which files will be included in the archive that gets produced. Finally, the reports section defines folders where static files were generated that should be made available (used by the agent's HTTP host to share these reports).

```yaml
---
platforms:
  darwin:
    architecture:
      - 'x64'
  linux:
    architecture:
      - 'x64'
projects:
  project1:
    path: './project1'
    steps:
      npm:
        path: './'
        command: 'npm'
        arguments:
          - 'install'
      test:
        path: './'
        command: 'gulp'
        arguments:
          - 'test'
    pack:
      pattern: './node_modules/**,./src/**'
    reports:
      plato: './plato'
      clientTests: './clientTests'
```

## Dependencies

 * when
 * lodash
 * machina
 * monologue
 * drudgeon
 * globulesce
 * nonstop-pack
 * js-yaml
 * debug

## Dependents
The following nonstop projects rely on this library:

 * [build cli](https://github.com/LeanKit-Labs/nonstop-cli)
 * [build agent](https://github.com/LeanKit-Labs/nonstop-agent)
