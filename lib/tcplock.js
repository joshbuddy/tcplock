var net = require('net');

exports.Tcplock = function(listenPort, proxyPort, proxyHost) {
	this.stack = [];
  this.listenPort = listenPort;
  this.proxyPort = proxyPort;
  this.proxyHost = proxyHost;
  this.client = null;
}

exports.Tcplock.prototype = {
  addStream: function(stream) {
    stream.pause();
    this.stack.push(stream);
    this.assignCurrentConnection();
  },

  assignCurrentConnection: function() {
    if (this.stack.length > 0) {
      if (this.stack[0].paused)
      this.stack[0].unpause();
      this.client = net.connection
    }
  }

  start: function() {
    var lock = this;
    this.server = net.createServer(function (stream) {
      stream.on('connect', function () {
        lock.addStream(stream);
      });

      stream.on('data', function (data) {
        client.write(data);
      });

      stream.on('end', function () {
        var idx = connections.index(stream);
        if (idx != -1) {
          connections.slice(idx, 1);
          client.close();
          if (idx == 0 && connections.length != 0) {
            connections[0].unpause();
          }
        }
      });
    });
    this.server.listen(8124, 'localhost');
  }
};


