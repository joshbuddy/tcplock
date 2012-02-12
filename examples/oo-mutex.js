// Places a mutex in front of the Open Office Python-UNO bridge.
var TCPLock = require('tcplock').TCPLock,
	puts = require('util').puts,
	exec = require('child_process').exec,
	portscanner = require('portscanner'),
	count = 0,
	timeoutOccurred = false;

function waitForOOState(state, callback) {
		(function checkForOOP() {
			portscanner.checkPortStatus(8100, 'localhost', function(err, status) {
				if (status == state) {
					callback();
				} else {
					setTimeout(checkForOOP, 250);
				}
			});
		})();	
}

var lock = new TCPLock({
	listenPort: 9000,
	proxyPort: 8100,
	timeout: 20000, // Only alow OOP to run for 20 seconds.
	proxyHost: '0.0.0.0',
 	onActivateNextConnection: function(activateNextConnection) {
		if ( (count % 20) == 0 || timeoutOccurred) {
			timeoutOccurred = false;
			exec('killall -9 soffice.bin libreoffice soffice', function(error, stdout, stderr) {
		
				waitForOOState('closed', function() {
					exec('libreoffice -headless -nofirststartwizard -accept="socket,host=0.0.0.0,port=8100;urp;StarOffice.Service"'); 
					waitForOOState('open', function() {
						activateNextConnection();
					});
				});
		
			});
		} else {
			activateNextConnection();
		}
		count += 1;
	},
	onTimeoutOccurred: function() {
		timeoutOccurred = true;
	}
});
