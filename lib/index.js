var tcplock = require('./tcplock.js'),
  args = require('argsparser').parse(),
  puts = require('util').puts;

var lock = tcplock.Tcplock.new(args['node'][0], args['node'][1], args['node'][2]);
lock.start();