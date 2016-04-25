
var colors = require('colors'); colors.enabled = true;
var async = require('async');
var script = require('../../regression/diffTool.js');


module.exports = function init( config, updcb, onReady ){

  if( !updcb ) {
    updcb = function( msg ){
      return process.send(msg);
    };
  }

  config = config || {};

  var task = {

    name: 'taskDifftool',

    start: async.apply( startTask, config.rootA, config.rootB, config.output, updcb )

  };

  function startTask( rootA, rootB, output, updcb, cb ){

    isRunning = true;

    console.log( 'Starting %s', task.name );

    script.call( null, rootA, rootB, output, updcb, cb);

  }

  return onReady ? onReady( null, task ) : task;
};



// to use this directly from the command line
if(!module.parent){
  var argv = require('yargs').argv;
  var config = {
    rootA : argv.rootA,
    rootB : argv.rootB,
    output : argv.output
  };

  module.exports.call(
    module.exports,
    config,  // config
    null, // updcb
    function onReady( err, res ){
      if( err ){
        console.error( ('#'+err.toString()).cyan );
        return process.exit(1);
      } else {
        return res.start( function(err,res){
          if( err ){
            console.error( '~'+err.toString()+'~' );
          }
          return process.exit(err?1:0);
        } );
      }
    }
  );
}
