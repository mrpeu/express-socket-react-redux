'use strict';
let path = require('path');
let webpack = require('webpack');

module.exports = [ {
  name: 'server',
  target: 'node',
  entry: ['./server/main.js'],
  output: {
    path: './build/server/',
    filename: 'main.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
      // ,{
      //   test: /\.json$/,
      //   loader: 'json'
      // }
    ]
  }} ];
