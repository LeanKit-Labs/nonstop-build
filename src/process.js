var _ = require( 'lodash' );
var when = require( 'when' );
var exec = require( 'child_process' ).exec;
var spawn = require( 'win-spawn' );

function startProcess( target ) {
	return when.promise( function( resolve, reject, notify ) {
		try {
			var errors = [];
			var pid = spawn( target.command, target.arguments, {
				cwd: target.path || './',
				env: process.env
			} );
			pid.stdout.setEncoding( 'utf8' );
			pid.stderr.setEncoding( 'utf8' );
			pid.stdout.on( 'data', function( data ) {
				notify( data );
			} );
			pid.on( 'close', function( code ) {
				if( code !== 0 ) { // || errors.length > 0
					reject( errors );
				} else {
					resolve( code );
				}
			} );
			pid.stderr.on( 'data', function( err ) {
				errors.push( err );
			} );
		} catch( e ) {
			reject( new Error( 'Failure failed failingly with ' + e.stack ) );
		}
	} );
}

function executeCommand( line, path ) {
	return when.promise( function( resolve, reject ) {
		var command = _.isArray( line ) ? line.join( ' ' ) : line;
		exec( command, 
			{ cwd: path },
			function( err, stdout, stderr ) {
				if( err ) {
					reject( { error: err, output: stdout } );
				} else {
					resolve( stdout );
				}
			} );
	} );
}

module.exports = {
	start: startProcess,
	execute: executeCommand
};