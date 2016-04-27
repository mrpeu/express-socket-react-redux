
var chalk = require( 'chalk' );
var fs = require( 'fs' );
var yargs = require( 'yargs' )
  .option( 'number', { alias: 'n', type: 'number' } )
  .option( 'speed', { alias: 's', type: 'string' } )
  .usage( 'Usage: $0 -number [num] -speed [num]' )
;

module.exports = start;

// to use this directly from the command line
if ( !module.parent ) {
  var argv = process.argv.slice();
  argv.shift(); // node
  argv.shift(); // js
  module.exports.call(
    module.exports,
    yargs.argv,
    null,
    function ( err, result ) {
      if ( err ) {
        console.error( err );
        return process.exit( 1 );
      } else {
        return result.start( argv.shift() );
      }
    }
  );
}



function start( cfg, updcb, onReady ) {
  var cfg = cfg || {},
    isRunning = false,
    defaultSendOutput = process.send ? function ( msg ) { process.send( msg ); } : function () {};
  cbOut = cfg.cbOut || function ( msg ) { defaultSendOutput( msg ); },
    cbWar = cfg.cbWar || function ( msg ) { msg.loglevel = 'warning'; defaultSendOutput( msg ); },
    cbErr = cfg.cbErr || function ( msg ) { defaultSendOutput( msg ); },
    updcb = updcb || defaultSendOutput,
    interval = null
  ;

  var getDoc = function ( fname ) {
    return fs.existsSync( fname ) ?
      fs.readFileSync( fname ).toString() :
      ''
    ;
  };

  var docUsage = '';
  // yargs.showHelp( function(str){ return docUsage += str; } );

  var task = {
    name: 'taskDummy',
    doc: getDoc( 'taskDummy.md' ),
    help: docUsage,
    config: cfg,
    status: {
      name: 'dummy',
      ts: Date.now(),
      total: 0,
      value: 0,
      runs: [ { name: 'counting...', id: Date.now(), value: 0, total: 0 } ]
    },
    start: function ( nb, cb ) {
      return startTask( nb || cfg.number, cb );
    }
  };

  task.status.state = 'Step: ' + ( ~~task.speed + '' ) + 'ms';

  function startTask( nb, cb ) {

    task.status.total = 1;
    task.status.ts = Date.now();

    if ( !task.config.speed ) { task.config.speed = Math.random() * 1000 + 100; }
    if ( !nb ) { nb = ~~( Math.random() * 30 ) + 1; }
    task.status.nb = nb;

    isRunning = true;

    task.status.runs[ 0 ].total = +nb || task.status.runs[ 0 ].total;
    task.status.runs[ 0 ].value = 0;

    console.log( 'Starting taskDummy' );

    updcb( task.status );

    interval = setInterval( _execute, task.config.speed );

    console.log( chalk.cyan( task.status.runs[ 0 ].value + '' ) +
      '/' + task.status.runs[ 0 ].total + ' (' + ( ~~task.config.speed + '' ) + 'ms)'
    );

    return task;
  }

  function _execute() {

    task.status.runs[ 0 ].value++;

    console.log( chalk.cyan( task.status.runs[ 0 ].value + '' ) +
      '/' + task.status.runs[ 0 ].total + ' (' + ( ~~task.config.speed + '' ) + 'ms)'
    );

    if ( task.status.runs[ 0 ].value >= task.status.runs[ 0 ].total || !isRunning ) {

      clearInterval( interval );
      task.status.te = Date.now();
      task.status.value = task.status.total;

      if ( !isRunning ) {
        task.status.state = 'Stopped.';
        console.log( 'Stopped taskDummy' );
      } else {
        task.status.state = 'Done.';
        console.log( 'Finished taskDummy' );
      }
      isRunning = false;

    } else {

      // task.status.state = "running...";

      // var r = Math.random()*100;
      // if(r<1){
      //   cbErr(task.status);
      // } else if(r<10){
      //   cbWar(task.status);
      // }
    }

    updcb( task.status );
    return cbOut( task.status );

  }

  return onReady ? onReady( null, task ) : task;
}
