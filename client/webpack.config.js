
const path = require( 'path' );
const webpack = require( 'webpack' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );

module.exports = [ {
  name: 'client',
  target: 'web',
  entry: [ './client/index.js' ],
  output: {
    path: './build/client/',
    filename: 'index.js'
  },
  devtool: 'eval', // prod: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel'
      }
    ]
  },
  plugins: [
    new LiveReloadPlugin( {
      port: 35729, // default: 35729
      appendScriptTag: true
    } )
  ]
} ];
