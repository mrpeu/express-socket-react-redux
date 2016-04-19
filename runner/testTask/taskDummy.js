
var chalk = require('chalk');

module.exports = start;

// to use this directly from the command line
if(!module.parent){
  var argv = process.argv.slice();
  argv.shift(); //node
  argv.shift(); //js
  module.exports.call(
    module.exports,
    {},
    null,
    function( err, result ){
      if( err ){
        console.error( err );
        return process.exit(1);
      } else {
        return result.start( argv.shift() );
      }
    }
  );
}



function start( cfg, updcb, onReady ){
  if( !updcb ) {
    updcb = function( msg ){
      return process.send(msg);
    };
  }

  var cfg = cfg || {},
    isRunning = false,
    cbOut = cfg.cbOut || function(msg){ process.send( msg ) },
    cbWar = cfg.cbWar || function(msg){ msg.loglevel='warning'; process.send( msg ) },
    cbErr = cfg.cbErr || function(msg){ process.send( msg ) },
    interval = null
  ;

  var task = {

    name: cfg.name || 'taskDummy',

    speed: Math.random()*1000+100,

    status: {
      name: 'dummy',
      ts: Date.now(),
      total: 1,
      value: 0,
      runs: [ { name: 'countdown', id: Date.now(), value: 0, total: 0 } ]
    },

    start: startTask.bind(this)

  };

  function startTask( nb, cb ){

    task.status.ts = Date.now();

    if ( !nb ) { nb = ~~( Math.random() * 9 )+1; }

    isRunning = true;

    task.status.runs[0].total = +nb || task.status.runs[0].total;
    task.status.runs[0].value = 0;

    console.log( 'Starting taskDummy' );

    updcb( task.status );

    interval = setInterval( _execute, task.speed);

    console.log( chalk.cyan(task.status.runs[0].value+'') +
      '/' + task.status.runs[0].total + ' (1/' + (~~task.speed+'')  + 'ms)'
    );

    return task;
  }

  function _execute(){

    task.status.runs[0].value++;

    console.log( chalk.cyan(task.status.runs[0].value+'') +
      '/' + task.status.runs[0].total + ' (1/' + (~~task.speed+'')  + 'ms)'
    );

    if(task.status.runs[0].value >= task.status.runs[0].total || !isRunning){

      clearInterval( interval );
      task.status.te = Date.now();
      task.status.value = task.status.total;

      if( !isRunning ) {
        task.status.state = "Stopped.";
        console.log( 'Stopped taskDummy' );
      } else {
        task.status.state = "Done.";
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
    return cbOut(task.status);

  };

  return onReady ? onReady( null, task ) : task;
};
