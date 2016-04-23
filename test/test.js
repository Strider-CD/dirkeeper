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

// Return only directories from the list of file names
function filterDirs(base, files) {
  return files.filter(function(f) {
    var stat = fs.statSync(path.join(base, f))
    if (!stat.isDirectory()) return
    return f
  })
}

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
    ], function(err) {
      fs.writeFileSync(path.join(TEN_SUBDIRS, "a_test_file"), "foobar")
      done()
    })
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
        var dirs = filterDirs(TEN_SUBDIRS, files)
        expect(dirs).to.have.length(0)
        done()
      })

    })
  })

  it('should do nothing if count >= actual number of subdirs', function(done) {

    keeper({ baseDir: TEN_SUBDIRS, count: 10 }, function(err) {

      fs.readdir(TEN_SUBDIRS, function(err, files) {
        var dirs = filterDirs(TEN_SUBDIRS, files)
        expect(dirs).to.have.length(10)
        done()
      })

    })
  })

  it('should correctly prune oldest directories when needed', function(done) {
    fs.readdir(TEN_SUBDIRS, function(err, origFiles) {
      keeper({ baseDir: TEN_SUBDIRS, count: 3 }, function(err) {
        fs.readdir(TEN_SUBDIRS, function(err, files) {
          var dirs = filterDirs(TEN_SUBDIRS, files)
          expect(dirs).to.have.length(3)
          // the earliest dir names are the oldest. see makeDirs().
          expect(dirs).to.not.contain([
            'tmpfile.0', 'tmpfile.1', 'tmpfile.2', 'tmpfile.3', 'tmpfile.4', 'tmpfile.5', 'tmpfile.6',
          ])
          done()
        })
      })
    })
  })

})
