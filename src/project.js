var _ = require( 'lodash' );
var machina = require( 'machina' );
var when = require( 'when' );
var Monologue = require( 'monologue.js' )( _ );
var createRunner = require( './stepRunner.js' );
var debug = require( 'debug' )( 'project' );
var packager = require( 'continua-pack' );

function createProjectMachine( name, config, repInfo ) {
	var Machine = machina.Fsm.extend( {
		_handler: function( ev ) {
			return function( result ) {
				this.handle( ev, result );
			}.bind( this );
		},

		_handlers: function( op ) {
			return {
				progress: function( data ) { this.emit( op + '.data', data ); }.bind( this ),
				success: this._handler( op + '-done' ),
				failure: this._handler( op + '-failed' )
			};
		},

		_build: function() {
			this.project = createRunner( config, repInfo.path ? repInfo.path : repInfo );
			this._promise( 'build', this.project.build );
		},

		_getPackageInfo: function() {
			this._promise( 'packageInfo', packager.getInfo, name, config, repInfo );
		},

		_pack: function( packageInfo ) {
			this._promise( 'package', packager.create, packageInfo );
		},

		_promise: function( op, promise ) {
			var args = Array.prototype.slice.call( arguments, 2 );
			var handles = this._handlers( op );
			promise.apply( null, args )
				.progress( handles.progress )
				.then( handles.success )
				.then( null, handles.failure );
		},

		_upload: function( packageInfo ) {
			this._promise( 'upload', packager.upload, packageInfo );
		},

		build: function() {
			return when.promise( function( resolve, reject, notify ) {
				var eventSubscription = this.on( 'build.data', function( line ) {
					debug( '\t %s', line.data.replace( '\n', '' ) );
					notify( line );
				}.bind( this ) );
				this.on( 'project.done', function( packageInfo ) {
					eventSubscription.unsubscribe();
					resolve( packageInfo );
				}.bind( this ) ).once();
				this.on( 'project.failed', function( err ) {
					eventSubscription.unsubscribe();
					var stack = err.error ? ( err.error.stack || err.error ) : 'no error provided';
					var error = new Error( 'Step ' + err.step + ' failed with error: ' + stack );
					reject( error );
				}.bind( this ) ).once();
				this.transition( 'initializing' );
			}.bind( this ) );
		},

		states: {
			'initializing': {
				_onEnter: function() {
					this._getPackageInfo();
				},
				'packageInfo-done': function( packageInfo ) {
					this.packageInfo = packageInfo;
					this.version = packageInfo.version;
					debug( 'package info for %s %s - %s', name, this.version, JSON.stringify( packageInfo ) );
					this.transition( 'building' );
				},
				'packageInfo-failed': function( err ) {
					debug( 'failed to attain package info for %s %s', name, this.version );
					this.emit( 'project.failed', { step: 'packageInfo', error: err } );
				},
			},
			'building': {
				_onEnter: function() {
					this._build();
				},
				'build-done': function() {
					debug( 'build completed for %s %s', name, this.version );
					this.transition( 'packaging' );
				},
				'build-failed': function( err ) {
					debug( 'build failed for %s %s with %s', name, this.version, err.stack );
					this.emit( 'project.failed', { step: 'build', error: err } );
				}
			},
			'packaging': {
				_onEnter: function() {
					this._pack( this.packageInfo );
				},
				'package-done': function( packageInfo ) {
					debug( 'packaging for %s %s completed', name, this.version );
					this.emit( 'project.done', packageInfo );
				},
				'package-failed': function( err ) {
					debug( 'packaging for %s %s failed with %s', name, this.version, err.stack );
					this.emit( 'project.failed', { step: 'pack', error: err } );
				}
			}
		}
	} );
	Monologue.mixin( Machine );
	var machine = new Machine();
	return machine;
}

module.exports = function() {
	return {
		create: createProjectMachine
	};
};