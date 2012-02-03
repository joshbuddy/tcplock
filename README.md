TCPLock
=======

It's happened to everyone, you want to connect on a TCP/IP socket, but you need a mutex in front of it!

Luckily, TCPLock is here for you. TCPLock is a TCP/IP proxy that only allows a single connection through at a time.

Usage
-----

<<<<<<< HEAD
_node tcplock.js -l [port to listen to] -p [port to proxy to] -h [host to proxy to]_
=======
_tcplock -l [port to listen to] -p [port to proxy to] -h [host to proxy to] -n [number of connections to allow]_
>>>>>>> 77ffc9415ffe4f2e88b260ba666571babcb9ac16
