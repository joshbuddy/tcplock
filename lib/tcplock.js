var net = require('net'),
	puts = require('util').puts,
	sexy = require('sexy-args');

exports.TCPLock = function(params) {
	sexy.args([this, ['object1']], {
		object1: {
			listenPort: null,
			proxyPort: null,
			proxyHost: 'localhost',
			totalConnections: 1,
			start: true,
			timeout: -1
		}
	}, function() {
		this.listenPort = params.listenPort;
		this.proxyPort = params.proxyPort;
		this.proxyHost = params.proxyHost
		this.totalConnections = params.totalConnections;
		this.timeout = params.timeout;

		this.connectionQueue = [];
		this.currentConnections = [];
		this.proxyConnections = {};
		this.activeConnectionCount = 0;

		if (params.start) {
			this.start();
		}
  });
}

exports.TCPLock.prototype = {
	
	start: function() {
		var _this = this;
		
		this.server = net.createServer(function (connection) {
			connection.on('connect', function () {
				_this._enqueueConnection(connection);
			});
			
			connection.on('data', function (data) {
				try {
					_this.proxyConnections[connection.remotePort].write(data);
				} catch(e) {
					_this._endConnection(connection);
				}
			});
			
			connection.on('end', function () {
				_this._endConnection(connection);
			});
			
			connection.on('error', function () {
				_this._endConnection(connection);
			});
		});
		
		this.server.listen(this.listenPort, this.proxyHost);
	},
	
	_endConnection: function(connection) {
		var idx = this.currentConnections.indexOf(connection);
		if (idx != -1) {
			this.activeConnectionCount--;
			this.currentConnections.splice(idx, 1);
			this.proxyConnections[connection.remotePort].end();
			delete this.proxyConnections[connection.remotePort];
			connection.end();
			this._activateConnections();
		}
	},
	
	_enqueueConnection: function(connection) {
		connection.pause();
		this.connectionQueue.push(connection);
		this._activateConnections();
	},
	
	_activateConnections: function() {
		var _this = this;
		while (this.activeConnectionCount < this.totalConnections && this.connectionQueue.length) {
			var connection = this.connectionQueue.shift();
			this.currentConnections.push(connection);
			this._createProxyConnection(connection);
			connection.resume();
			
			// How long should we wait before killing
			// the active connection?
			if (this.timeout > -1) {
				setTimeout(function() {
					_this._endConnection(connection);
				}, this.timeout);
			}
			
			this.activeConnectionCount += 1;
		}
	},
	
	_createProxyConnection: function(connection) {
		var _this = this,
			proxyConnection = net.createConnection(this.proxyPort, this.proxyHost);
		this.proxyConnections[connection.remotePort] = proxyConnection;
		
		proxyConnection.on('data', function (data) {
			try {
				connection.write(data);
			} catch(e) {
				_this._endConnection(connection);
			}
		});
		
		proxyConnection.on('error', function (data) {
			_this._endConnection(connection);
		});
	}
};
