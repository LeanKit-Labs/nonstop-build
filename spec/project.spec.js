var should = require( 'should' ); // jshint ignore:line
var _ = require( 'lodash' );
var fs = require( 'fs' );
var project = require( '../src/project.js' )();

describe( 'when creating package for a project', function() {
	var packageInfo;

	before( function( done ) {
		this.timeout( 10000 );
		var projectConfig = {
			path: './',
			steps: {
				npm: {
					path: './',
					command: 'npm',
					arguments: [ 'install' ]
				}
			},
			pack: {
				pattern: './node_modules/**,./src/**'
			}
		};
		var repoInfo = {
			owner: 'arobson',
			branch: 'master',
			commit: '',
			path: './spec/testProject'
		};
		project.create( 'project1', projectConfig, repoInfo )
			.build()
			.then( function( info ) {
				packageInfo = info;
				done();
			} );
	} );

	it( 'should complete build and package', function() {
		_.omit( packageInfo, 'files' ).should.eql( {
			branch: 'master',
			build: 0,
			commit: '',
			name: 'project1~arobson~master~0.0.0~0~darwin~any~any~x64',
			output: 'packages/project1~arobson~master~0.0.0~0~darwin~any~any~x64.tar.gz',
			owner: 'arobson',
			path: 'spec/testProject/',
			pattern: './node_modules/**,./src/**',
			version: '0.0.0'
		} );
	} );

	it( 'should have created archive', function() {
		fs.existsSync( packageInfo.output ).should.be.true; // jshint ignore:line
	} );

	it( 'should have correct file list', function() {
		_.all( packageInfo.files, function( file ) {
			return /(node_modules|index.js)/.test( file );
		} );
	} );

	after( function( done ) {
		fs.unlink( packageInfo.output, function() {
			done();
		} );
	} );

} );