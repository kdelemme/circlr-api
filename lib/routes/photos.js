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


  /**
   * Admin Create, Read All
   */
  router.route('')
    .all(tokenService.verify('access_token'), function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      next();
    })
    .post(directives.validation.schema(schemas.photos.create), function(req, res, next) {
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

          var photo = {
            uuid: imageUuid,
            path: path.join(folder, imageUuid + '.' + req.files.image.extension),
            circlr_id: req.circlr.id,
            description: req.body.description
          };
          knexClient('photos').insert(photo).returning('id')
            .then(function(row) {
              return res.status(200).json(R.merge(photo, { id: row[0] }));
            });
        });
      });
    })
    .get(function(req, res, next) {
      knexClient.select('id', 'uuid', 'path', 'description', 'created_at').from('photos').where({ circlr_id: req.circlr.id })
        .then(function(rows) {
          return res.status(200).json(rows);
        });
    });

  /**
   * Admin Update, Delete Routes
   */
  router.route('/:id')
    .all(tokenService.verify('access_token'), function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      next();
    })
    .put(directives.validation.schema(schemas.photos.update), function(req, res, next) {
      knexClient('photos').where({ id: req.params.id, circlr_id: req.circlr.id })
        .update({ description: req.body.description })
        .then(function(result) {
          return res.status(200).send({updated: true});
        });
    })
    .delete(function(req, res) {
      knexClient('photos').where({id: req.params.id, circlr_id: req.circlr.id }).returning('id').del()
        .then(function (result) {
          var photoId = result[0];
          return knexClient('circles_photos').where({
            circlr_id: req.circlr.id,
            photo_id: photoId
          }).del();
        }).then(function () {
          return res.status(200).send({deleted: true});
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