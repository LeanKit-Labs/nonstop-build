var should = require( 'should' ); // jshint ignore:line
var _ = require( 'lodash' );
var fs = require( 'fs' );
var path = require( 'path' );
var project = require( '../src/project.js' )();

describe( 'Project', function() {
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
				build: packageInfo.build,
				commit: '',
				name: packageInfo.name,
				output: packageInfo.output,
				owner: 'arobson',
				path: path.resolve( './spec/testProject/' ),
				pattern: './node_modules/**,./src/**',
				version: '0.0.1',
				slug: undefined
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

	describe( 'when creating build with no package for a project', function() {
		var packageInfo;
		var out = [];
		before( function( done ) {
			this.timeout( 1000 );
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
			var p = project.create( 'project1', projectConfig, repoInfo );
			p
				.build( true )
				.then( null, null, function( data ) {
					if( out.length === 0 ) {
						out.push( data.stderr );
					} else {
						var line = out[ out.length - 1 ];
						line = line + data.stderr;
						out[ out.length - 1 ] = line;
					}
					if( /\n/.test( data.stderr ) ) {
						out.push( "" );
					}

				} )
				.then( function( info ) {
					packageInfo = info;
					done();
				} );
		} );

		it( 'should complete build and package', function() {
			_.omit( packageInfo, 'files' ).should.eql( {
				branch: 'master',
				build: packageInfo.build,
				commit: '',
				name: packageInfo.name,
				output: packageInfo.output,
				owner: 'arobson',
				path: path.resolve( './spec/testProject/' ),
				pattern: './node_modules/**,./src/**',
				version: '0.0.1',
				slug: undefined
			} );
		} );

		it( 'should have notified of build output', function() {
			out.should.eql(
				[
					'npm WARN package.json test-agent@0.0.1 No repository field.\n',
					'npm WARN package.json test-agent@0.0.1 No README data\n',
					''
				]
			);
		} );

		it( 'should not create archive', function() {
			fs.existsSync( packageInfo.output ).should.be.false; // jshint ignore:line
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

	describe( 'when project info is bad', function() {
		var error;

		before( function( done ) {
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
				path: './spec/murhurhurhur'
			};

			project
				.create( 'project1', projectConfig, repoInfo )
				.build()
				.then( null, function( err ) {
					error = err;
					done();
				} );
		} );

		it( 'should report problem', function() {
			error.toString().split( '\n' )[ 0 ].should.equal( 'Error: Step "packageInfo" failed: Cannot search for version files in bad path "' + path.resolve( './' ) + '/spec/murhurhurhur"' );
		} );

		it( 'should not have produced output', function() {
			fs.readdirSync( './packages' ).should.eql( [] );
		} );
	} );

	describe( 'when pattern yields no results', function() {
		var error;

		before( function( done ) {
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
					pattern: './lol/**'
				}
			};
			var repoInfo = {
				owner: 'arobson',
				branch: 'master',
				commit: '',
				path: './spec/testProject'
			};

			project
				.create( 'project1', projectConfig, repoInfo )
				.build()
				.then( null, function( err ) {
					error = err;
					done();
				} );
		} );

		it( 'should report problem', function() {
			error.toString().split( '\n' )[ 0 ].should.equal( 'Error: Step "pack" failed: No files matched the pattern "./lol/**" in path "' + path.resolve( './' ) + '/spec/testProject". No package was generated.' );
		} );

		it( 'should not have produced output', function() {
			fs.readdirSync( './packages' ).should.eql( [] );
		} );
	} );

	describe( 'when build step results in an error', function() {
		var error;

		before( function( done ) {
			var projectConfig = {
				path: './',
				steps: {
					npm: {
						path: './',
						command: 'ls',
						arguments: [ 'derp' ]
					}
				},
				pack: {}
			};
			var repoInfo = {
				owner: 'arobson',
				branch: 'master',
				commit: '',
				path: './spec/testProject'
			};

			var p = project.create( 'project1', projectConfig, repoInfo );
			p.build()
				.then( null, function( err ) {
					error = err;
					done();
				} );
		} );

		it( 'should report problem', function() {
			error.toString().should.equal( 'Error: Step "build" failed: ls: derp: No such file or directory\n' );
		} );

		it( 'should not have produced output', function() {
			fs.readdirSync( './packages' ).should.eql( [] );
		} );
	} );
} );
