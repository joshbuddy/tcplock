var net = require('net'),
  puts = require('util').puts;

exports.TCPLock = function(listenPort, proxyPort, proxyHost, totalConnections) {
  this.connectionQueue = [];
  this.currentConnections = [];
  this.listenPort = listenPort;
  this.proxyPort = proxyPort;
  this.proxyHost = proxyHost || 'localhost';
  this.proxyConnections = {};
  this.totalConnections = totalConnections;
  this.activeConnectionCount = 0;
}

exports.TCPLock.prototype = {
  
  start: function() {
    var _this = this;
    
    this.server = net.createServer(function (connection) {
      connection.on('connect', function () {
        _this._enqueueConnection(connection);
      });
      
      connection.on('data', function (data) {
        _this.proxyConnections[connection].write(data);
      });
      
      connection.on('end', function () {
	      _this._endConnection(connection);
      });
    });
    
    this.server.listen(this.listenPort, 'localhost');
  },

  _endConnection: function(connection) {
    var idx = this.currentConnections.indexOf(connection);
    if (idx != -1) {
      this.activeConnectionCount--;
      this.currentConnections.splice(idx, 1);
      this.proxyConnections[connection].end();
      delete this.proxyConnections[connection];
      this._activateConnections();
    }
  },

  _enqueueConnection: function(connection) {
    connection.pause();
    this.connectionQueue.push(connection);
    this._activateConnections();
  },
  
  _activateConnections: function() {
    while (this.activeConnectionCount < this.totalConnections && this.connectionQueue.length) {
      var connection = this.connectionQueue.shift();
      this.currentConnections.push(connection);
      this._createProxyConnection(connection);
      connection.resume();
      this.activeConnectionCount += 1;
    }
  },
  
  _createProxyConnection: function(connection) {
    this.proxyConnections[connection] = net.createConnection(this.proxyPort, this.proxyHost);
    this.proxyConnections[connection].on('data', function (data) {
      connection.write(data);
    });
  }
};
