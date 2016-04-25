
var colors = require('colors'); colors.enabled = true;
var async = require('async');
var script = require('../../regression/runAndDiff.js');


module.exports = function init( pathRequestFolder, pathResponseFolder, mmwConfig, pathResponseReferenceFolder, diffToolConfig, updcb, onReady ){

  if( !updcb ) {
    updcb = function( msg ){
      return process.send(msg);
    };
  }

  var task = {

    name: 'taskRunAndDiff',

    start: async.apply( startTask, pathRequestFolder, pathResponseFolder, mmwConfig, pathResponseReferenceFolder, diffToolConfig, updcb )

  };

  function startTask( pathRequestFolder, pathResponseFolder, mmwConfig, pathResponseReferenceFolder, diffToolConfig, updcb, cb ){

    console.log( 'Starting %s', task.name );

    script.call( null, pathRequestFolder, pathResponseFolder, mmwConfig, pathResponseReferenceFolder, diffToolConfig, updcb, cb);

  }

  return onReady ? onReady( null, task ) : task;
};



// to use this directly from the command line
if(!module.parent){
  var argv = process.argv.slice();
  argv.shift(); //node
  argv.shift(); //js
  module.exports.call(
    module.exports,
    process.argv[2],  // pathRequestFolder
    process.argv[3],  // pathResponseFolder
    process.argv[4],  // mmwConfig
    process.argv[5],  // pathResponseReferenceFolder
    process.argv[6],  // diffToolConfig
    null, // updcb
    function onReady( err, res ){
      if( err ){
        console.error( err.toString().red );
        return process.exit(1);
      } else {
        return res.start( function(err,res){
          if( err ){
            console.error( 'ERROR taskRunAndDiff:', JSON.stringify(err.trim(),null,1) );
            return process.exit(1);
          }else{
            return process.exit(0);
          }
        } );
      }
    }
  );
}
