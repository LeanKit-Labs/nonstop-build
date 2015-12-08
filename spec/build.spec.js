var should = require( 'should' );
var sinon = require( 'sinon' );
var when = require( 'when' );
var buildFn = require( '../src/build.js' );
var _ = require( 'lodash' );

describe( 'Build', function() {
	var result;
	var build, buildFile, project, projectFn;
	var buildFileMock, projectMock, projectFnMock;

	function setup() {
		buildFile = { get: function() {} };
		buildFileMock = sinon.mock( buildFile );

		project = { build: function() {} };
		projectMock = sinon.mock( project );

		projectFn = { create: function() {} };
		projectFnMock = sinon.mock( projectFn );

		build = buildFn( buildFile, projectFn );
	}

	function reset() {
		projectFnMock.restore();
		projectMock.restore();
		buildFileMock.restore();
	}

	describe( 'with no projects', function() {
		before( function( done ) {
			setup();

			var repoInfo = './';
			var projectName = 'test';

			buildFileMock.expects( 'get' )
				.withArgs( repoInfo )
				.returns( { platforms: { 'darwin': { architecture: [ 'x64' ] } }, projects: {} } );

			projectMock.expects( 'build' )
				.withArgs( undefined )
				.returns( when( { fake: true } ) );

			projectFnMock.expects( 'create' )
				.returns( undefined );

			build.start( repoInfo, projectName )
				.then( function( status ) {
					result = status;
					done();
				} );
		} );

		it( 'should resolve to an empty status', function() {
			result.should.eql( {} );
		} );

		after( function() {
			reset();
		} );
	} );

	describe( 'with valid, single-project file', function() {
		before( function( done ) {
			setup();

			var repoInfo = './';
			var projectName = 'test';

			buildFileMock.expects( 'get' )
				.withArgs( repoInfo )
				.returns( { platforms: { 'darwin': { architecture: [ 'x64' ] } }, projects: { test: {} } } );

			projectMock.expects( 'build' )
				.withArgs( undefined )
				.returns( when( { fake: true } ) );

			projectFnMock.expects( 'create' )
				.returns( project );

			build.start( repoInfo, projectName )
				.then( function( status ) {
					result = status;
					done();
				} );
		} );

		it( 'should result in project status', function() {
			result.should.eql( [ { state: 'fulfilled', value: { fake: true } } ] );
		} );

		after( function() {
			reset();
		} );
	} );

	describe( 'with multiple projects file', function() {
		before( function( done ) {
			setup();

			var repoInfo = './';

			buildFileMock.expects( 'get' )
				.withArgs( repoInfo )
				.returns( { platforms: { 'darwin': { architecture: [ 'x64' ] } }, projects: { test1: {}, test2: {} } } );

			projectMock.expects( 'build' )
				.withArgs( undefined )
				.twice()
				.returns( when( { fake: true } ) );

			projectFnMock.expects( 'create' )
				.twice()
				.returns( project );

			build.start( repoInfo )
				.then( function( status ) {
					result = status;
					done();
				} );
		} );

		it( 'should result in project status', function() {
			result.should.eql( [ 
				{ state: 'fulfilled', value: { fake: true } },
				{ state: 'fulfilled', value: { fake: true } }
			] );
		} );

		after( function() {
			reset();
		} );
	} );

	describe( 'with a selected project', function() {
		before( function( done ) {
			setup();

			var repoInfo = './';

			buildFileMock.expects( 'get' )
				.withArgs( repoInfo )
				.returns( { platforms: { 'darwin': { architecture: [ 'x64' ] } }, projects: { test1: {}, test2: {} } } );

			projectMock.expects( 'build' )
				.withArgs( undefined )
				.twice()
				.returns( when( { fake: true } ) );

			projectFnMock.expects( 'create' )
				.withArgs( 'test1', {}, './' )
				.returns( project );

			build.start( repoInfo, 'test1' )
				.then( function( status ) {
					result = status;
					done();
				} );
		} );

		it( 'should result in a single project status', function() {
			result.should.eql( [ 
				{ state: 'fulfilled', value: { fake: true } }
			] );
		} );

		after( function() {
			reset();
		} );
	} );

	describe( 'when a project fails', function() {
		var failingProject = { build: function() {} };
		var failingProjectMock;

		before( function( done ) {
			setup();

			var repoInfo = './';

			buildFileMock.expects( 'get' )
				.withArgs( repoInfo )
				.returns( { platforms: { 'darwin': { architecture: [ 'x64' ] } }, projects: { test1: {}, test2: {} } } );

			projectMock.expects( 'build' )
				.withArgs( undefined )
				.returns( when( { fake: true } ) );

			failingProjectMock = sinon.mock( failingProject );
			failingProjectMock.expects( 'build' )
				.withArgs( undefined )
				.returns( when.reject( new Error( 'project has a sad' ) ) );

			projectFnMock
				.expects( 'create' )
				.twice()
				.onCall( 0 )
				.returns( failingProject )
				.onCall( 1 )
				.returns( project );

			build.start( repoInfo )
				.then( function( status ) {
					result = status;
					done();
				} );
		} );

		it( 'should result in project status', function() {
			result.should.eql( [
				{ state: 'fulfilled', value: { failed: true, error: 'project has a sad', name: undefined } },
				{ state: 'fulfilled', value: { fake: true }  }				 
			] );
		} );

		after( function() {
			failingProjectMock.restore();
			reset();
		} );
	} );
} );