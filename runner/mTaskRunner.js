var os = require('os')
var fs = require('fs')
var dgram = require('dgram')
var dserver = dgram.createSocket( "udp4" )
var dclient = dgram.createSocket( "udp4" )
var spawn = require('child_process').spawn
var path = require('path')
var chalk = require('chalk')
var uuid = require('node-uuid')

var pathTasks = 'task/';
var controlPort = 33334;
var runnerPort = 33333;
var HTTP_SERVER_URL = 'http://wks-talos:3000';

var child = null;
var _child_uuid_cached = null;
var httpsocket = null;
var identity = {
  cid: os.hostname(), // todo improve
  name: 'taskRunner@' + os.hostname(),
  role: 'runner',
  color: '#557',
  doc:[
    'mTaskRunner',
    '---',
    'Basic app to command execution of NodeJS scripts'
    ].join('\n')
  ,
  actions: [] // automatically filled from "pathTasks/"
};

var noop = function(){return arguments};

if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", function () {
  //graceful shutdown
  quit();
  process.exit();
});


dserver.bind( function ()
{
  dserver.setBroadcast( true );
  dserver.setMulticastTTL( 128 );
} );

function broadcast( msgJson, callback )
{
  msgJson.hostname = os.hostname();
  if(child){
    msgJson.pid = child.pid;
  }

  var msgBuffer = new Buffer( JSON.stringify( msgJson ) );
  dserver.send( msgBuffer, 0, msgBuffer.length, controlPort, "224.1.1.1", callback );
}

dclient.on('listening', function () {
  dclient.setBroadcast(true);
  dclient.setMulticastTTL(128);
  dclient.addMembership('224.1.1.1');
  console.log("Client task runner is listening for remote control input. Press CTRL-C to quit!");
});

dclient.on('message', executeMessage );

function executeMessage( message, clientInfo, cb ) {
  cb = cb || noop;

  // console.warn( JSON.stringify(message) )

  var msgJson = message;

  if( message && Buffer.isBuffer(message) ) {
    msgJson = JSON.parse(message.toString());
  }

  // console.warn( chalk.magenta( JSON.stringify(msgJson,0,2)) )

  if( !msgJson.targets && msgJson.cmd!=='ping?' ) {
    var errorMessage = '[taskRunner] Invalid arguments';
    console.error( errorMessage );
    return cb( errorMessage );
  }

  // Is this message for this runner?
  if( msgJson.cmd!=='ping?' && msgJson.targets.indexOf( os.hostname() )<0 ) {
    var errorMessage = 'This message was not for me (' + os.hostname() + ' ⊄ [' + msgJson.targets.join() + '])';
    // console.log(errorMessage);
    return cb( errorMessage );
  }


  switch (msgJson.cmd) {

    case 'ping?':
      console.log( chalk.blue('ping!') );
      broadcast({out:'ping!'});
      break;

    case 'start':
      startChild( msgJson, clientInfo, cb );
      break;

    case 'stop':
      stopChild();
      break;

    case 'quit':
      quit();
      break;
  }
}

function stopChild() {
  if (child) {
    console.log(chalk.blue("Stopping child process..."));
    child.kill();
  } else {
    console.log(chalk.blue("No child to stop."));
  }
}

function startChild( msgJson, clientInfo, cb ){
  cb = cb || noop;

  // artificial limit to only keep one child process at a time
  // because we only need and handle one for now.
  if( child !== null ){
    var errorMessage = chalk.yellow('"Start" ignored: only one child process is allowed simultaneously.');

    console.error( errorMessage );
    broadcast( { war: errorMessage } );

    return cb( errorMessage );
  }

  var appName = msgJson.prms[0];
  var cmdArgs = msgJson.prms.slice(1);

  console.log(chalk.blue('\nStarting child "'+appName+'" with params: '+ JSON.stringify(cmdArgs)));
  // console.log('\n%s'.magenta, path.resolve( appName ))

  _child_uuid_cached = msgJson.rid || uuid.v4();

  console.log(chalk.blue('broadcast uuid/rid: %s'), _child_uuid_cached);
  broadcast( { rid: _child_uuid_cached, start: true, origin: msgJson, name: 'booting...', value: 1, total: 1 } );

  try  {
    child = spawn( appName, cmdArgs, { stdio: [null,null,null,'ipc'] } );
    console.log(chalk.blue('spawn uuid/rid: %s, pid: %s'),
      _child_uuid_cached, child.pid);

    // End results, returned(=broadcasted) only at the end of the run,
    // but can be gathered during execution.
    child.results = [];
    child.uuid = _child_uuid_cached;

    child.stdout.on( 'data', function ( data ){
      console.log( data.toString().trim() );
      // console.log( chalk.cyan('on stdout'), data.toString().trim() );
      broadcast( { rid: child.uuid, out: data.toString() } );
    } );

    child.stderr.on( 'data', function ( data ){
      // console.error( 'ERROR from :', appName, JSON.stringify(cmdArgs) );
      // console.log( chalk.cyan('on stderr'), data.toString().trim() );
      console.error( chalk.red(data.toString().replace(/\n$/,'')) );
      broadcast( { rid: child.uuid, err: data.toString() } );
    } );


    child.on( 'message', function( data ){
      // console.log( chalk.yellow('on message') )
      // console.log( JSON.stringify( data, 0, 1 ) );
      if( child && data.results ){
        child.results = child.results.concat( data.results );
      }

      if( httpsocket ) {
        if( !data.id ) data.id = child.uuid;
        httpsocketSendStatus( data );
      } else {
        console.error( 'httpsocket unreachable');
      }
    });


    child.on( 'error', function ( err ){
      console.error( chalk.red('error: ' + JSON.stringify(err)) );
      broadcast( { rid: child.uuid, err: JSON.stringify(err) } );
    } );

    child.on( 'exit', function( exitcode, signal ){
      console.log(chalk.blue("Child process stopped. %s"), child.uuid);
      // console.log( chalk.blue(JSON.stringify( child, 0, 1 )) );
      broadcast( { rid: child.uuid, exit: exitcode, signal: signal, results: child.results } );
      cb( null, { rid: child.uuid, exit: exitcode, signal: signal, results: child.results } )
      child = null;
    });
  }
  catch(e)
  {
      console.error( chalk.red(e.message) );
      broadcast( { rid: _child_uuid_cached || uuid.v4(), exit: 1, err: 'exception: ' + e.message.toString() }, function ( err )
      {
      } );
      console.log(chalk.red("Stopping child process (after exception)..."));
      if (child) child.kill();
      child = null;
      if( cb ) cb( e.message );
  }
}

function quit() {
  console.log( 'Quitting...' );
  broadcast( { out: "Quitting" }, function ( err )
  {
    if( dclient ) {
      console.log( 'dclient.close()...' );
      dclient.close();
    }
    if( dserver ) {
      console.log( 'dserver.close()...' );
      dserver.close();
    }
    if( child ) {
      console.log( 'child.kill()...' );
      child.kill();
    }
    if( httpsocket ) {
      console.log( 'httpsocket.disconnect()...' );
      httpsocket.disconnect();
    }
    console.log( 'process.exit(0)...' );
    process.exit(0);
  } );
}

function init() {
  // from http://stackoverflow.com/a/5827895/1263612
  var walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
      if (err) return done(err);
      var pending = list.length;
      if (!pending) return done(null, results);
      list.forEach(function(file) {
        file = path.resolve(dir, file);
        // file = dir +'/'+ file;
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            walk(file, function(err, res) {
              results = results.concat(res);
              if (!--pending) done(null, results);
            });
          } else {
            if( /\.js$/.test(file) ){
              // load task to get meta infos
              var task = require( file )();

              var action = {
                script: file,
                name: task.name,
                doc: task.doc,
                help: task.help ? task.help.trim() : null,
                config: task.config
              };
              // var pathMd = file.replace(/\.js$/,'\.md');
              // if (fs.existsSync(pathMd)) {
              //     // Do something
              //     action.doc = fs.readFileSync( pathMd ).toString();
              // }

              results.push( action );
            }
            if (!--pending) done(null, results);
          }
        });
      });
    });
  };

  walk( pathTasks, function( err, res ){
    if( err ) console.error( err );

    identity.actions = res.map( function( a ) {
      a.id = a.id || uuid.v4();
      return a;
    });

    identity.actions.push( {
      id: uuid.v4(),
      name: 'stop'
    } );

    console.log( 'Available tasks:' );
    console.log( chalk.blue(
      '  -',
      identity.actions.map( function( a ) {
        return a.name + ( a.help ? ': ' + a.help : '' );
      } ).join( '\n  - ' )
    ) );

    dclient.bind(runnerPort);

    broadcast({out:'ping!',name:'ping'});

    httpsocket = require('socket.io-client')(HTTP_SERVER_URL);


    httpsocket.on('connect', function () {

      httpsocket.emit( 'authentication', { client: identity } );

      httpsocket.on( 'notwelcome', function ( data ) {
        console.log( 'notwelcome' );
      } );

      httpsocket.on( 'welcome', function ( data ) {
        console.log( HTTP_SERVER_URL, 'says:',
          'welcome', data.client.cid, data.client.sid );

        // rudimentary "I-am-alive" ping
        setInterval( function(){
          httpsocket.emit( 'chat-message', { cid: identity.cid } );
        }, 30000 );
      } );

      httpsocket.on( 'start', function( data, cb ) {
        if ( data.name === 'stop' ) {
          stopChild();
          cb( null, data );
        } else {
          // console.warn( 'start', data, clientInfo );
          if( !data.config ){
            data.config = identity.actions.find( function(a){ return a.name === data.name; } ).config;
          }

          startChild( {
            targets: [os.hostname()],
            cmd: 'start',
            prms: [ 'bin/jx', pathTasks+data.name ],
            config: data.config
          }, {}, cb );
        }
      } );

    } );

  } );

}

function httpsocketSendStatus( data ) {
  // console.log( 'httpsocketSendStatus', data );
  httpsocket.emit( 'client-status', data );
}

init();
