"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');
var uuid = require('node-uuid');
var R = require('ramda');
var validator = require('validator');

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
    .post(directives.validation.schema(schemas.circles.create), function(req, res) {
      var circle = {
        uuid: uuid.v4(),
        circlr_id: req.circlr.id,
        name: req.body.name
      };

      knexClient('circles').insert(circle).returning('id')
        .then(function (result) {
          return res.status(200).json(R.merge(circle, {id: result[0]}));
        });
    })
    .get(function(req, res) {
      knexClient.select('id', 'uuid', 'name', 'created_at')
        .from('circles')
        .where({ circlr_id: req.circlr.id })
        .orderBy('created_at', 'DESC')
        .then(function(rows) {
          return res.status(200).json(rows);
        });
    });

  /**
   * Admin Read, Update, Delete
   */
  router.route('/:id')
    .all(tokenService.verify('access_token'), function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      next();
    })
    .get(function(req, res, next) {
      knexClient.select('id', 'uuid', 'name', 'created_at').from('circles').where({ circlr_id: req.circlr.id, id: req.params.id }).limit(1)
        .then(function(row) {
          if (!row && row.length === 0) {
            return next(new errors.EntityNotFoundError('circle'));
          }

          return res.status(200).json(row[0]);
        });
    })
    .put(directives.validation.schema(schemas.circles.update), function(req, res) {
      knexClient('circles').where({ id: req.params.id, circlr_id: req.circlr.id }).update({ name: req.body.name })
        .then(function(result) {
          return res.status(200).send({updated: true});
        });
    })
    .delete(function(req, res) {
      knexClient('circles').where({ id: req.params.id, circlr_id: req.circlr.id }).returning('id').del()
        .then(function(result) {
          var circleId = result[0];
          return knexClient('circles_photos').where({ circlr_id: req.circlr.id, circle_id: circleId }).update({ circle_id: null });
        }).then(function() {
          return res.status(200).send({deleted: true});
        });
    });

  /**
   * Public get photos belonging to this circle uuid
   */
  router.get('/:uuid/photos', function(req, res, next) {
    if (!validator.isUUID(req.params.uuid)) {
      return next(new errors.MissingParameterError(['uuid']));
    }

    knexClient.select('photos.uuid', 'photos.description')
      .from('circles')
      .where({ uuid: req.params.uuid, circlr_id: req.circlr.id })
      .leftJoin('circles_photos', 'circles.id', 'circles_photos.circle_id')
      .innerJoin('photos', 'circles_photos.photo_id', 'photos.id')
      .then(function(rows) {
        return res.status(200).json(rows);
      });
  });

  router.route('/:circleId/photos/:photoId')
    .all(tokenService.verify('access_token'), function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      knexClient.select('id').from('circles').where({id: req.params.circleId, circlr_id: req.circlr.id}).limit(1)
        .then(function(row) {
          if (!row || row.length === 0) {
            return next(new errors.EntityNotFoundError('circles'));
          }

          return knexClient.select('id').from('photos').where({id: req.params.photoId, circlr_id: req.circlr.id}).limit(1);
        })
        .then(function(row) {
          if (!row || row.length === 0) {
            return next(new errors.EntityNotFoundError('photos'));
          }

          next();
        });
    })
    .post(function(req, res, next) {
      knexClient.select('circle_id', 'photo_id', 'circlr_id')
        .from('circles_photos').where({ circle_id: req.params.circleId, photo_id: req.params.photoId, circlr_id: req.circlr.id}).limit(1)
        .then(function(row) {
          if (row && row.length === 1) {
            return next(new errors.EntityAlreadyExistError('circles_photos'));
          }

          return knexClient('circles_photos').insert({circle_id: req.params.circleId, photo_id: req.params.photoId, circlr_id: req.circlr.id});
        })
        .then(function(row) {
          return res.status(200).json({associated: true});
        });
    })
    .delete(function(req, res, next) {
      knexClient('circles_photos').where({circle_id: req.params.circleId, photo_id: req.params.photoId, circlr_id: req.circlr.id}).del()
        .then(function(row) {
          return res.status(200).json({deleted: true});
        });
    });

  return router;
};