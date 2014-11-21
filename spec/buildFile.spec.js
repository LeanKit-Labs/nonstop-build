var should = require( 'should' );
var buildFile = require( '../src/buildFile.js' );
var build = require( '../src/build.js' )();

describe( 'when loading correct yaml file', function() {
	var config;
	before( function( done ) {
		buildFile.get( './spec/testProject' )
			.then( function( c ) { 
				config = c;
				done();
			} )
			.then( null, function( /* error */ ) {
				done();
			} );
	} );

	it( 'should get valid config', function() {
		should( config.projects.project1 ).exist; // jshint ignore:line
	} );
} );

describe( 'when no yaml file is available', function() {
	var error;
	before( function( done ) {
		buildFile.get( './durp' )
			.then( function() { 
				done();
			} )
			.then( null, function( e ) {
				error = e;
				done();
			} );
	} );

	it( 'should get valid config', function() {
		error.toString().should.equal( 'Error: No nonstop json or yaml file was found in path ./durp' );
	} );
} );

describe( 'when bad file is available', function() {
	var error;
	before( function( done ) {
		buildFile.get( './spec/badFiles' )
			.then( function() {
				done();
			} )
			.then( null, function( e ) {
				error = e;
				done();
			} );
	} );

	it( 'should get error', function() {
		error.toString().should.equal( 'Error: Failed to load a nonstop configuration file with JS-YAML: end of the stream or a document separator is expected at line 10, column 1:\n    :\n    ^' );
	} );
} );

describe( 'when checking for existence of a build file', function() {

	describe( 'with build file', function() {
		var exists;
		before( function( done ) {
			build.hasBuildFile( './spec/testProject' )
				.then( function( result ) {
					exists = result;
					done();
				} );
		} );

		it( 'should resolve to true', function() {
			exists.should.be.true; // jshint ignore:line
		} );
	} );

	describe( 'without build file', function() {
		var exists;
		before( function( done ) {
			build.hasBuildFile( './spec/projects' )
				.then( function( result ) {
					exists = result;
					done();
				} );
		} );

		it( 'should resolve to false', function() {
			exists.should.be.false; // jshint ignore:line
		} );
	} );

} );