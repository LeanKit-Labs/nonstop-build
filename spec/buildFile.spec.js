var should = require( 'should' );
var buildFile = require( '../src/buildFile.js' );
var build = require( '../src/build.js' )( buildFile );
var fs = require( 'fs' );

describe( 'Build File', function() {
	var buildData = {
		platforms: {
			darwin: {
				architecture: [ 'x64' ]
			}
		},
		projects: {
			project1: {

			}
		}
	};

	describe( 'Bad path', function() {
		var error;
		before( function( done ) {
			buildFile.get( './durp' )
				.then( null, function( err ) {
					error = err;
					done();
				} );
		} );

		it( 'should report bad path', function() {
			error.toString().should.equal( 'Error: No nonstop build file could be loaded from bad path: ./durp' );
		} );
	} );

	describe( 'YAML file', function() {

		before( function() {
			buildFile.save( './spec/files/nonstop.yaml', buildData, 'yaml' );
		} );

		describe( 'when loading correct yaml file', function() {
			var config;
			before( function( done ) {
				buildFile.get( './spec/files' )
					.then( function( c ) {
						config = c;
						done();
					} );
			} );

			it( 'should get valid config', function() {
				should( config.projects.project1 ).exist; // jshint ignore:line
			} );

			after( function() {
				fs.unlinkSync( './spec/files/nonstop.yaml' );
			} );
		} );

		describe( 'when no yaml file is available', function() {
			var error;
			before( function( done ) {
				buildFile.get( './spec/files' )
					.then( null, function( e ) {
						error = e;
						done();
					} );
			} );

			it( 'should get valid config', function() {
				error.toString().should.equal( 'Error: No nonstop json or yaml file was found in path ./spec/files' );
			} );
		} );
	} );

	describe( 'JSON file', function() {

		before( function() {
			buildFile.save( './spec/files/nonstop.json', buildData, 'json' );
		} );

		describe( 'when loading correct json file', function() {
			var config;
			before( function( done ) {
				buildFile.get( './spec/files' )
					.then( function( c ) {
						config = c;
						done();
					} );
			} );

			it( 'should get valid config', function() {
				should( config.projects.project1 ).exist; // jshint ignore:line
			} );

			after( function() {
				fs.unlinkSync( './spec/files/nonstop.json' );
			} );
		} );

		describe( 'when no json file is available', function() {
			var error;
			before( function( done ) {
				buildFile.get( './spec/files' )
					.then( null, function( e ) {
						error = e;
						done();
					} );
			} );

			it( 'should get valid config', function() {
				error.toString().should.equal( 'Error: No nonstop json or yaml file was found in path ./spec/files' );
			} );
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
			error.toString().should.equal( 'Error: Failed to load a nonstop configuration file with YAMLException: end of the stream or a document separator is expected at line 10, column 1:\n    :\n    ^' );
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
} );
