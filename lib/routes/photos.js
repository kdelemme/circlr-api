"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');
var uuid = require('node-uuid');
var fs = require('fs-extra');
var path = require('path');
var R = require('ramda');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  router.post('', tokenService.verify('access_token'), function(req, res, next) {
    if (req.user.id !== req.circlr.user_id) {
      return next(new errors.AuthenticationRequiredError());
    }

    var imageUuid = uuid.v4();
    var folder = req.files.image && req.files.image.name && req.files.image.name.substr(0, req.files.image.name.indexOf('.'));
    var uploadPath = path.join(config.upload.path, folder);

    fs.ensureDir(uploadPath, function(err) {
      if (err) {
        return next(new errors.InternalError());
      }

      fs.move(req.files.image.path, path.join(uploadPath, imageUuid + '.' + req.files.image.extension), function(err) {
        if (err) {
          return next(new errors.InternalError());
        }

        var photo = {uuid: imageUuid, path: path.join(folder, imageUuid + '.' + req.files.image.extension), circlr_id: req.circlr.id, description: req.body.description};
        knexClient('photos').insert(photo).returning('id')
          .then(function(row) {
            return res.status(200).json(R.merge(photo, { id: row[0] }));
          });
      });
    });
  });

  router.get('/:uuid', function(req, res, next) {
    knexClient.select('uuid', 'path', 'description').from('photos').where({ uuid: req.params.uuid, circlr_id: req.circlr.id }).limit(1)
      .then(function(row) {
        if (!row || row.length === 0) {
          return next(new errors.EntityNotFoundError('photos'));
        }

        return res.status(200).json(row[0]);
      });
  });

  return router;
};