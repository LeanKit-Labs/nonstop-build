var _ = require( 'lodash' );
var machina = require( 'machina' );
var when = require( 'when' );
var path = require( 'path' );
var Monologue = require( 'monologue.js' )( _ );
var processControl = require( './process.js' );
var sysInfo = require( './sysInfo.js' )();

function addStep( step, name, workingPath, context ) {
	var succeeded = name + '-done';
	var failed = name + '-failed';
	var shell = {
			_onEnter: function() {
				var result = this._handlers( name );
				step.path = path.join( workingPath, step.path || '' );
				processControl.start( step )
					.progress( result.output )
					.then( result.success )
					.then( null, result.failure )
					.catch( result.failure );
			}.bind( context )
		};
	shell[ succeeded ] = function() { this._nextStep(); }.bind( context );
	shell[ failed ] = function( err ) { this.emit( 'build.failed', err ); }.bind( context );
	context.states[ name ] = shell;
	context._steps.push( name );
}

function createMachine( project, workingPath ) {
	workingPath = path.join( workingPath || './', project.path );

	var Machine = machina.Fsm.extend( {
		_steps: [], //_.keys( project.steps ),
		_index: 0,
		stepOutput: {},

		_aggregate: function( op ) {
			return function( data ) {
				this.stepOutput[ op ] = this.stepOutput[ op ] || [];
				this.stepOutput[ op ].push( data );
				this.emit( op + '.output', data );
			}.bind( this );
		},

		_handler: function( ev ) {
			return function( result ) {
				this.handle( ev, result );
			}.bind( this );
		},

		_handlers: function( op ) {
			return  { 
				output: this._aggregate( op ),
				success: this._handler( op + '-done' ),
				failure: this._handler( op + '-failed' )
			};
		},

		_nextStep: function() {
			var currentStep = this._steps[ this._index ];
			if( currentStep === _.last( this._steps ) ) {
				this.emit( 'build.complete' );
			} else {
				this.transition( this._steps[ ( ++ this._index ) ] );
			}
		},

		build: function() {
			return when.promise( function( resolve, reject, notify ) {
				var stream = this.on( '#.output', function( data, env ) {
					notify( { step: env.topic.split( '.' )[ 0 ], data: data } );
				} );
				this.on( 'build.complete', function() {
					stream.unsubscribe();
					resolve();
				} ).once();
				this.on( 'build.failed', function( error ) {
					stream.unsubscribe();
					reject( error );
				} ).once();
				this.transition( this._steps[ 0 ] );
			}.bind( this ) );
		},

		initialState: 'init',
		states: {
			init: {
				_onEnter: function() {
					_.each( project.steps, function( step, name ) {
						var platforms = getValidPlatforms( step );
						if( _.contains( platforms, sysInfo.platform ) ) {
							addStep( step, name, workingPath, this );
						}
					}.bind( this ) );
				}
			}
		},
		initialize: function() {
			this.build = this.build.bind( this );
		}
	} );

	Monologue.mixin( Machine );
	var machine = new Machine();
	return machine;
}

function getValidPlatforms( step ) {
	if( !step.platform ) {
		return [ 'darwin', 'win32', 'linux' ];
	} else {
		return _.isArray( step.platform ) ? step.platform : [ step.platform ];
	}
}

module.exports = createMachine;