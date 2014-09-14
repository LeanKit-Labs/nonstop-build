require( 'should' );
var when = require( 'when' );
var createRunner = require( '../src/stepRunner.js' );
var badProject = require( './projects/badProject.js' );
var goodProject = require( './projects/goodProject.js' );

describe( 'when building a project with multiple steps', function() {
	var project = createRunner( goodProject, './' );
	var failed = false;
	var succeeded = false;
	var output = [];

	before( function( done ) {
		when.promise( function() { 
			project.build()
				.progress( function( data ) {
					output.push( JSON.stringify( data ) );
				} )
				.then( function( /* info */ ) {
					succeeded = true;
					done();
				} )
				.then( null, function( e ) {
					console.log( e.stack );
					failed = true;
					done();
				} );
		} );
	} );

	it( 'should result in a success status', function() {
		console.log( output.join( '\n' ) );
		succeeded.should.be.true;  // jshint ignore:line
		failed.should.be.false;  // jshint ignore:line
	} );
} );

describe( 'when building a project with a failing step', function() {
	var project = createRunner( badProject );
	var failed = false;
	var succeeded = false;
	var output = [];
	before( function( done ) {
		project.build()
			.progress( function( data ) {
				output.push( JSON.stringify( data ) );
			} )
			.then( function() {
				succeeded = true;
				done();
			} )
			.then( null, function( /* error */ ) {
				failed = true;
				done();
			} );
	} );

	it( 'should result in a failed status', function() {
		succeeded.should.be.false; // jshint ignore:line
		failed.should.be.true; // jshint ignore:line
		console.log( output.join( '\n' ) );
	} );
} );