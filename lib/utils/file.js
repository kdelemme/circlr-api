var Promise = require('bluebird');
var async = require('async');
var R = require('ramda');
var fs = require('fs-extra');
var path = require('path');

module.exports = function(config) {
  return {
    deleteFolders: function deleteFolder(paths) {
      return new Promise(function(resolve, reject) {
        var series = R.map(function (p) {
          return function (callback) {
            console.log(p);
            var fullPath = path.join(config.upload.path, p);

            fs.remove(fullPath, function (err) {
              callback(err);
            });
          };
        }, paths);

        async.series(series, function (err, result) {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      });
    }
  };
};