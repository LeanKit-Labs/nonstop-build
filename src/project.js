var _ = require( 'lodash' );
var machina = require( 'machina' );
var when = require( 'when' );
var Monologue = require( 'monologue.js' )( _ );
var drudgeon = require( 'drudgeon' );
var debug = require( 'debug' )( 'nonstop:project' );
var packager = require( 'nonstop-pack' );
var path = require( 'path' );
var platform = require( 'os' ).platform();

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
			var basePath = path.join( ( repInfo.path ? repInfo.path : repInfo ), config.path );
			this.project = drudgeon( config.steps, basePath );
			this._promise( 'build', this.project.run );
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
				.then( null, handles.failure )
				.catch( handles.failure );
		},

		_upload: function( packageInfo ) {
			this._promise( 'upload', packager.upload, packageInfo );
		},

		build: function( noPack ) {
			this.noPack = noPack || !( config.pack && config.pack.pattern );
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
					reject( new Error( 'Step ' + err.step + ' failed with error: ' + stack ) );
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
					this.transition( this.noPack ? 'done' : 'packaging' );
				},
				'build-failed': function( err ) {
					if( err.failedStep ) {
						err = err[ err.failedStep ].join( '\n' ) || 'build step "' + err.failedStep + '" exited with a non-zero code';
					}
					debug( 'build failed for %s %s with %s', name, this.version, err.stack ? err.stack : err );
					this.emit( 'project.failed', { step: 'build', error: err } );
				}
			},
			'packaging': {
				_onEnter: function() {
					this._pack( this.packageInfo );
				},
				'package-done': function( packageInfo ) {
					debug( 'packaging for %s %s completed', name, this.version );
					this.transition( 'done' );
				},
				'package-failed': function( err ) {
					debug( 'packaging for %s %s failed with %s', name, this.version, err.stack );
					this.emit( 'project.failed', { step: 'pack', error: err } );
				}
			},
			done: {
				_onEnter: function() {
					this.emit( 'project.done', this.packageInfo );
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