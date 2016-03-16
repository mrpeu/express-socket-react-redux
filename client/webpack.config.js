'use strict';
let path = require('path');

module.exports = [ {
  name: 'client',
  target: 'web',
  entry: ['./client/index.js'],
  output: {
    path: './build/client/',
    filename: 'index.js'
  },
  devtool: 'eval', //prod: 'source-map',
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
} ];
