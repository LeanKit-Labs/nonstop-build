var _ = require( 'lodash' );
var yaml = require( 'js-yaml' );
var when = require( 'when' );
var glob = require( 'globulesce' );
var path = require( 'path' );
var fs = require( 'fs' );

function getBuildFile( repositoryPath ) {
	if( fs.existsSync( repositoryPath ) ) {
		return glob( repositoryPath, '{**,.}/*nonstop.{json,yaml}' )
			.then( function( matches ) {
				if( _.isEmpty( matches ) ) {
					return when.reject( new Error( 'No nonstop json or yaml file was found in path ' + repositoryPath ) );
				} else {
					try {
						var file = matches[ 0 ];
						var content = fs.readFileSync( file );
						var ext = path.extname( file );
						if( ext === '.json' ) {
							return parseJson( content );
						} else {
							return parseYaml( content );
						}
					} catch ( e ) {
						return when.reject( new Error( 'Failed to load a nonstop configuration file with ' + e ) );
					}
				}
			} );
	} else {
		return when.reject( new Error( 'No nonstop build file could be loaded from bad path: ' + repositoryPath ) );
	}
}

function parseYaml( content ) {
	return yaml.safeLoad( content.toString() );
}

function parseJson( content ) {
	return JSON.parse( content );
}

function saveJson( file, content ) {
	return fs.writeFileSync( file, JSON.stringify( content, null, 2 ) );
}

function saveYaml( file, content ) {
	return fs.writeFileSync( file, yaml.dump( content ) );
}

module.exports = {
	get: getBuildFile,
	save: function( file, content, format ) {
		var write = format === 'json' ? saveJson : saveYaml;
		write( file, content );
	}
};