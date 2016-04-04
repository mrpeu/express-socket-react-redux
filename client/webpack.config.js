
const path = require( 'path' );
const webpack = require( 'webpack' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );

module.exports = [ {
  name: 'client',
  target: 'web',
  entry: [ './client/index.js', './client/style.css' ],
  output: {
    path: './build/client/',
    filename: 'index.js'
  },
  devtool: 'eval', // prod: 'source-map',
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        loader: 'raw'
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
