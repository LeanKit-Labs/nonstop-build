var yaml = require( 'js-yaml' );
var when = require( 'when' );
var vinyl = require( 'vinyl-fs' );
var map = require( 'map-stream' );
var path = require( 'path' );
var fs = require( 'fs' );

function getBuildFile( repositoryPath ) {
	return when.promise( function( resolve, reject ) {
		var hadFiles = false;
		vinyl.src( 
				[ '{**,.}/*nonstop.{json,yaml}' ],
				{ cwd: repositoryPath, dot: true }
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
					reject( new Error( 'Failed to load a nonstop configuration file with ' + err ) );
				}
				cb( null, f );
			} ) )
			.on( 'end', function() {
				if( !hadFiles ) {
					reject( new Error( 'No nonstop json or yaml file was found in path ' + repositoryPath ) );
				}
			} )
			.on( 'error', function( e ) {
				reject( new Error( 'Failed to load a nonstop configuration file with ' + e.stack ) );
			} );
	} );
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