TCPLock
=======

Background
----------

TCPLock grows out of a problem I had working at [Attachments.me](http://attachments.me). We use OpenOffice's UNO web-service to convert between various document formats. Over time OpenOffice leaks memory and locks up.

A potential solution is to restart OpenOffice periodically. Here's the problem, at any given time many clients are connecting to OpenOffice for conversion. This makes restarting the service an unsafe operation.

My initial attempt to solve this problem was to use Redis as a semaphore, this turned out to be problematic.

My friend Josh suggested an elegant solution, a thin proxy layer that acts as a mutex.

I extended on this concept somewhat, adding functionality specific to my OpenOffice problem, and TCPLock was born.

Contributors
------------

[@benjamincoe](http://twitter.com/#/benjamincoe) Street walking cheetah with a heart full of napalm. CTO at Attachments.me.

[@joshbuddy](http://twitter.com/#/joshbuddy) Comprised entirely of ☃. if you criticize me i melt.

What Is It?
-----------

* TCPLock is a proxy layer that places a semaphore in front of an arbitrary TCP/IP service.
* TCPLock queues up connections and proxies them in a FIFO order.
* TCPLock provides hooks so that actions can be taken prior to accepting the next connection in the queue, e.g., restarting OpenOffice.

Usage
-----

```javascript
var TCPLock = require('tcplock').TCPLock

var lock = new TCPLock({
	listenPort: 9000,
	proxyPort: 8100,
	timeout: 20000,
	proxyHost: 'localhost',
 	onActivateNextConnection: function(activateNextConnection) {
		someCleanupAction(function() {
			activateNextConnection();
		}
	},
	onTimeoutOccurred: function() {
		someCleanupAction();
	}
});
```
* _listenPort_ the port that your client will connect to.
* _proxyPort_ the port of the service that will have a semaphore placed in front of it.
* _timeout_ the maximum TTL on a client connection.
* _proxyHost_ the host of the service the proxy is connecting to.
* _onActivateNextConnection_ called prior to a connection being activated. In the case of OpenOffice, I use this hook to restart the UNO service.
* _onTimeoutOccurred_ called if any connection reaches their TTL.

CLI Usage
---------

TCPLock also installs a command line application:

_tcplock -l [port to listen to] -p [port to proxy to] -h [host to proxy to] -n [number of connections to allow]_ -t _[connection timeout]_

Examples
--------

You can find a real-world example of TCPLock in the _/examples_ folder. The script:

* periodically restarts the OpenOffice service.
* limits the connections to UNO to a single client at a time.
* restarts the OpenOffice service if a timeout event occurs.

Copyright
---------

Copyright (c) 2011 Benjamin Coe and Joshua Hull. See LICENSE.txt for further details.