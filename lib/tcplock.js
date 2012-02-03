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
}

exports.TCPLock.prototype = {
  
  start: function() {
    var _this = this;
    
    this.server = net.createServer(function (connection) {
      connection.on('connect', function () {
        _this._enqueueConnection(connection);
      });
      
      connection.on('data', function (data) {
        _this.getProxyConnection(connection).write(data);
      });

      connection.on('end', function () {
	      _this._endConnection(connection);
      });
    });
    
    this.server.listen(this.listenPort, 'localhost');
  },


  _endConnection: function(connection) {
    var idx = _this.currentConnections.indexOf(connection);
      if (idx != -1) {
        _this.currentConnections.splice(idx, 1);
        _this.proxyConnections[connection].end();
        delete _this.proxyConnections[connection];
        _this._activateConnections();
      }
    }
  },

  _enqueueConnection: function(connection) {
    connection.pause();
    this.connectionQueue.push(connection);
    this._activateConnections();
  },
  
  _activateConnections: function() {
    while (this.activeConnectionCount < totalConnections) {
      this.currentConnections.push(this.connectionQueue[0]);
      this.connectionQueue.splice(0, 1);
      this._createProxyConnection(this.connectionQueue[this.connectionQueue.length]);
      this.currentConnections[this.connectionQueue.length].resume();
    }
  },
  
  _createProxyConnection: function(connection) {
    var _this = this;
    this.proxyConnections[connection] = net.createConnection(this.proxyPort, this.proxyHost);
    
    this.proxyConnections[connection].on('data', function (data) {
      connection.write(data);
    });
  }
};
