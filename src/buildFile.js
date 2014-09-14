var yaml = require( 'js-yaml' );
var when = require( 'when' );
var vinyl = require( 'vinyl-fs' );
var map = require( 'map-stream' );
var path = require( 'path' );

function getBuildFile( repositoryPath ) {
	return when.promise( function( resolve, reject ) {
		var hadFiles = false;
		vinyl.src( 
				[ 
					'.continua.[jy][sa][om][nl]', 
					'.continua.[jy][sa][om][nl]', 
					'**/.continua.[jy][sa][om][nl]',
					'**/continua.[jy][sa][om][nl]'
				],
				{ cwd: repositoryPath }
			).pipe( map( function( f, cb ) {
				hadFiles = true;
				var ext = path.extname( f.path );
				try {
					if( ext === '.json' ) {
						resolve( parseJson( f.contents ) );
					} else {
						resolve( parseYaml( f.contents ) );
					}
				} catch( err ) {
					reject( new Error( 'Failed to load a continua configuration file with ' + err ) );
				}
				cb( null, f );
			} ) )
			.on( 'end', function() {
				if( !hadFiles ) {
					reject( new Error( 'No continua json or yaml file was found in path ' + repositoryPath ) );
				}
			} )
			.on( 'error', function( e ) {
				reject( new Error( 'Failed to load a continua configuration file with ' + e.stack ) );
			} );
	} );
}

function parseYaml( content ) {
	return yaml.safeLoad( content.toString() );
}

function parseJson( content ) {
	return JSON.parse( content );
}

module.exports = {
	get: getBuildFile
};