dirkeeper
=========

[![Greenkeeper badge](https://badges.greenkeeper.io/Strider-CD/dirkeeper.svg)](https://greenkeeper.io/)

Prune a directory to contain a set number of sub-directories, retention policy is recency. That is to say, oldest sub-directories are pruned
first.

Installation
============

`npm install dirkeeper --save`

Usage
=====

```javascript
var keeper = require('dirkeeper');

// You wish to make '/myDir' only contain the 5 newest sub-directories
keeper({ count: 5, baseDir: '/myDir' }, function(err) {
  if (err) throw err;
  console.log('pruned');
});
```

A count of 0 means prune all sub-directories:

```javascript
var keeper = require('dirkeeper');

// You wish to make '/myDir' contain no sub-directories:
keeper({ count: 0, baseDir: '/myDir' }, function(err) {
  if (err) throw err;
  console.log('pruned everything');
});
```

Additionally, a count `>=` the actual number of sub-directories means prune nothing.


Tests
=====

Run `npm test`

License
=======

BSD

