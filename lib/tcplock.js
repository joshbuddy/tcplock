var net = require('net'),
  puts = require('util').puts;

exports.TCPLock = function(listenPort, proxyPort, proxyHost) {
  this.connectionQueue = [];
  this.listenPort = listenPort;
  this.proxyPort = proxyPort;
  this.proxyHost = proxyHost || 'localhost';
  this.proxyConnection = null;
  this.currentConnection = null;
}

exports.TCPLock.prototype = {
  
  start: function() {
    var _this = this;
    
    this.server = net.createServer(function (connection) {
      connection.on('connect', function () {
        _this._queueConnection(connection);
      });
      
      connection.on('data', function (data) {
        _this.proxyConnection.write(data);
      });

      connection.on('end', function () {
        var idx = _this.connectionQueue.indexOf(connection);
        if (idx != -1) {
          _this.connectionQueue.splice(idx, 1);
          _this.proxyConnection.end();
          if (idx == 0 && _this.connectionQueue.length != 0) {
            _this._setCurrentConnection();
          }
        }
      });
    });
    
    this.server.listen(this.listenPort, 'localhost');
  },
  
  _queueConnection: function(connection) {
    connection.pause();
    this.connectionQueue.push(connection);
    this._setCurrentConnection();
  },
  
  _setCurrentConnection: function() {
    if (this.connectionQueue.length > 0) {
      this.currentConnection = this.connectionQueue[0];
      this._createProxyConnection(this.currentConnection);
      this.connectionQueue[0].resume();
    }
  },
  
  _createProxyConnection: function(connection) {
    var _this = this;
    this.proxyConnection = net.createConnection(this.proxyPort, this.proxyHost);
    
    this.proxyConnection.on('data', function (data) {
      _this.connectionQueue[0].write(data);
    });
  }
};
