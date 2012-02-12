var net = require('net'),
	puts = require('util').puts,
	sexy = require('sexy-args');

exports.TCPLock = function(params, beforeNextActivate) {
	sexy.args([this, 'object1', 'function1'], {
		object1: {
			listenPort: null,
			proxyPort: null,
			proxyHost: 'localhost',
			totalConnections: 1,
			start: true,
			timeout: -1
		},
		function1: function(activateNextConnection) {
			activateNextConnection();
		}
	}, function() {
		this.listenPort = params.listenPort;
		this.proxyPort = params.proxyPort;
		this.proxyHost = params.proxyHost
		this.totalConnections = params.totalConnections;
		this.timeout = params.timeout;
		this.beforeNextActivate = beforeNextActivate;

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
			
			connection.end();
			this.activeConnectionCount--;
			this.currentConnections.splice(idx, 1);
			
			if (this.proxyConnections[connection.remotePort]) {
				this.proxyConnections[connection.remotePort].end();
				delete this.proxyConnections[connection.remotePort];
			}
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
		while (_this.activeConnectionCount < _this.totalConnections && _this.connectionQueue.length) {
			var connection = _this.connectionQueue.shift();
			_this.currentConnections.push(connection);
			
			(function (connection) {
				_this.beforeNextActivate(function() {
					_this._createProxyConnection(connection);
					connection.resume();
					
					// How long should we wait before killing
					// the active connection?
					if (_this.timeout > -1) {
						setTimeout(function() {
							_this._endConnection(connection);
						}, _this.timeout);
					}
				});
			})(connection);
		
			_this.activeConnectionCount += 1;
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
		
		proxyConnection.on('end', function (data) {
			_this._endConnection(connection);
		});
		
		proxyConnection.on('error', function (data) {
			_this._endConnection(connection);
		});
	}
};
