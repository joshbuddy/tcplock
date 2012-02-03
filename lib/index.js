var TCPLock = require('./tcplock.js').TCPLock,
  args = require('argsparser').parse(),
  puts = require('sys').puts;

if (!args['-l'] || !args['-p']) {
  puts('Options:\n\t-l listen port\n\t-p proxy port\n\t-h proxy host')
} else {
  var lock = new TCPLock(args['-l'], args['-p'], args['-h']);
  lock.start();
}