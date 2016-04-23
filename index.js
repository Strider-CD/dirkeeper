var async  = require('async')
var fs     = require('fs')
var path   = require('path')
var rmdir  = require('rimraf')

module.exports = function(opts, cb) {

    var baseDir = opts.baseDir

    var pruneToCount = function(count, dirs, cb) {

      // count >= dirs.length means prune nothing
      if (count >= dirs.length) {
        return cb(null, null)
      }

      // sort by mtime, oldest first
      dirs = dirs.sort(function(a, b) {
        return a.stats.mtime.getTime() > b.stats.mtime.getTime()
      })

      // trim all but *count* newest entries
      if (count !== 0) {
        dirs = dirs.slice(0, -count)
      }

      // delete *count* oldest directories
      var rmFuncs = []
      dirs.forEach(function(d) {
        rmFuncs.push(function(cb) {
          var fname = path.join(baseDir, d.name)
          rmdir(fname, cb)
        })
      })

      // rmdir in parallel
      async.parallel(rmFuncs, cb)
    }

    var baseDirResults = function(err, files) {
      if (err) {
        // Ignore it if it doesn't exist
        if (err.code === 'ENOENT') {
          return cb(null, null)
        }
        console.log(err)
        return cb(err)
      }

      if (files.length === 0) {
        return cb(null, null)
      }

      var statFuncs = files.map(function(f) {
        return function(cb) {
          fs.stat(path.join(baseDir, f), function(err, res) {
            // Might want to ignore errors?
            if (err) return cb(err)
            // Ignore non-directories
            if (res.isDirectory()) {
              return cb(null, {name:f, stats: res})
            }
            return cb(null, null)
          })
        }
      })

      async.parallel(statFuncs, function(err, dirs) {
        if (err) return cb(err)
        pruneToCount(opts.count, dirs.filter(function(d) { if (!d) return; return d }), cb)
      })
    }

    fs.readdir(baseDir, baseDirResults)
}
