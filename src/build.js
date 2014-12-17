var _ = require( 'lodash' );
var when = require( 'when' );
var sysInfo = require( './sysInfo.js' )();

function build( projectFn, buildFile, repoInfo, projectName, noPack ) {
	if( _.isBoolean( projectName ) ) {
		noPack = projectName;
	}

	return when.promise( function( resolve, reject ) {
		when.try( createProjects, projectFn, buildFile.get( repoInfo.path || repoInfo ), repoInfo, projectName )
			.then( function( projects ) {
				if( _.isEmpty( projects ) ) {
					resolve( {} );
				} else {
					when.settle( _.map( projects, function( project ) {
							return project.build( noPack ).then( null, function( err ) {
								return { failed: true, name: project.name, error: err.toString().replace( 'Error: ', '' ) };
							} );
						} ) )
					.then( function( status ) {
						resolve( status );
					} )
					.then( null, reject );
				}
			} )
			.then( null, function( err ) {
				reject( err );
			} );
	} );
}

function createProjects( project, config, repoInfo, projectName ) {
	var platforms = getPlatforms( config );
	if( _.contains( platforms, sysInfo.platform ) ) {
		if( projectName && config.projects[ projectName ] ) {
			return [ project.create( projectName, config.projects[ projectName ], repoInfo ) ];
		} else {
			return _.map( config.projects, function( projectConfig, projectName ) {
				return project.create( projectName, projectConfig, repoInfo );
			} );
		}
	}
	return [];
}

function getPlatforms( config ) { // jshint ignore : line
	if( !config.platforms ) {
		return [ 'darwin', 'linux', 'win32' ];
	}
	return _.keys( config.platforms );
}

module.exports = function( buildFile, project ) {
	buildFile = buildFile || require( './buildFile.js' );
	project = project || require( './project.js' )();
	return {
		hasBuildFile: function( repoInfo ) {
			return buildFile.get( repoInfo.path || repoInfo )
				.then( function() {
					return true;
				} )
				.then( null, function( err ) {
					if( err.badPath ) {
						throw err;
					} else {
						return false;
					}
				} );
		},
		saveFile: function( file, info, format ) {
			return buildFile.save( file, info, format );
		},
		start: build.bind( undefined, project, buildFile )
	};
};