var _ = require( 'lodash' );
var when = require( 'when' );
var buildFile = require( './buildFile.js' );
var sysInfo = require( './sysInfo.js' )();
var project;

function build( repoInfo, projectName, noPack ) {
	if( _.isBoolean( projectName ) ) {
		noPack = projectName;
	}

	return when.promise( function( resolve, reject ) {
		when.try( createProjects, buildFile.get( repoInfo.path || repoInfo ), repoInfo, projectName )
			.then( function( projects ) {
				if( _.isEmpty( projects ) ) {
					resolve( {} );
				} else {
					when.all( _.map( projects, function( project ) {
							return project.build( noPack );
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

function createProjects( config, repoInfo, projectName ) {
	var platforms = getPlatforms( config );
	if( _.contains( platforms, sysInfo.platform ) ) {
		if( projectName ) {
			return [ project.create( projectName, config.projects[ projectName ] ) ];
		} else {
			return _.map( config.projects, function( projectConfig, projectName ) {
				return project.create( projectName, projectConfig, repoInfo );
			} );
		}
	}
	return [];
}

function getPlatforms( config ) {
	if( !config.platforms ) {
		return [ 'darwin', 'linux', 'win32' ];
	}
	return _.keys( config.platforms );
}

module.exports = function() {
	project = require( './project.js' )();
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
		start: build
	};
};