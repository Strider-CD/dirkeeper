var async  = require('async')
var expect = require('chai').expect
var fs     = require('fs')
var keeper = require('../index.js')
var mkdirp = require('mkdirp')
var path   = require('path')
var rmdir  = require('rimraf')


var EMPTY_DIR = "/tmp/dirkeeper.test.empty"
var FOUR_SUBDIRS = "/tmp/dirkeeper.test.four"
var TEN_SUBDIRS = "/tmp/dirkeeper.test.ten"

function makeDirs(baseDir, numDirs, cb) {
  var count = 0

  async.whilst(
    function() { return count < numDirs },
    function(cb) {
      mkdirp(path.join(baseDir, "tmpfile." + count), function(err) {
        count++
        // Wait 1 second between files
        setTimeout(function() {
            cb(err)
        }, 1000)
      })
    },
    cb
  )
}

describe('#dirkeeper', function() {

  before(function(done) {
    this.timeout(20000)
    async.parallel([
      function(cb) {
        mkdirp(EMPTY_DIR, cb)
      },
      function(cb) {
        mkdirp(FOUR_SUBDIRS, function(err) {
          if (err) return cb(err)
          makeDirs(FOUR_SUBDIRS, 4, cb)
        })
      },
      function(cb) {
        mkdirp(TEN_SUBDIRS, function(err) {
          if (err) return cb(err)
          makeDirs(TEN_SUBDIRS, 10, cb)
        })
      }
    ], done)
  })

  after(function(done) {
    async.parallel([
      function(cb) {
        rmdir(EMPTY_DIR, cb)
      },
      function(cb) {
        rmdir(FOUR_SUBDIRS, cb)
      },
      function(cb) {
        rmdir(TEN_SUBDIRS, cb)
      }
    ], done)
  })

  it('should succeed on non-existant directories', function(done) {
    var opts = {
      baseDir: "/this/path/doesnt/exist/i/am/sure/of/it" + Math.floor(Math.random() * 10000)
    }

    keeper(opts, function(err) {
      expect(err).to.be.null
      done()
    })
  })

  it('should succeed on empty directories', function(done) {
    keeper({ baseDir: EMPTY_DIR }, function(err) {
      expect(err).to.be.null
      done()
    })
  })

  it('should delete all sub-directories if opts.count is 0', function(done) {

    keeper({ baseDir: FOUR_SUBDIRS, count: 0 }, function(err) {

      fs.readdir(FOUR_SUBDIRS, function(err, files) {
        expect(files).to.have.length(0)
        done()
      })

    })
  })

  it('should do nothing if count >= actual number of subdirs', function(done) {

    keeper({ baseDir: TEN_SUBDIRS, count: 10 }, function(err) {

      fs.readdir(TEN_SUBDIRS, function(err, files) {
        expect(files).to.have.length(10)
        done()
      })

    })
  })

})
