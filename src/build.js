var _ = require( 'lodash' );
var when = require( 'when' );
var buildFile = require( './buildFile.js' );
var sysInfo = require( './sysInfo.js' )();
var project;

function build( repoInfo ) {
	return when.promise( function( resolve, reject ) {
		when.try( createProjects, buildFile.get( repoInfo.path ), repoInfo )
			.then( function( projects ) {
				if( _.isEmpty( projects ) ) {
					resolve( {} );
				} else {
					when.all( _.map( projects, function( project ) {
							return project.build();
						} ) )
					.then( function( status ) {
						resolve( status );
					} )
					.then( null, reject );
				}
			} );
	} );
}

function createProjects( config, repoInfo ) {
	var platforms = getPlatforms( config );
	if( _.contains( platforms, sysInfo.platform ) ) {
		return _.map( config.projects, function( projectConfig, projectName ) {
			return project.create( projectName, projectConfig, repoInfo );
		} );
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
		start: build
	};
};