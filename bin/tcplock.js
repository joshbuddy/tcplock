#!/usr/bin/env node
var TCPLock = require('tcplock').TCPLock,
  args = require('argsparser').parse(),
  puts = require('util').puts;

if (!args['-l'] || !args['-p']) {
  puts('Options:\n\t-l listen port\n\t-p proxy port\n\t-h proxy host\n\t-n number of connections allowed')
} else {
  var lock = new TCPLock({
		listenPort: args['-l'],
		proxyPort: args['-p'],
		proxyHost: args['-h'],
		totalConnections: args['-n']
	});
}