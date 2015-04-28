"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');
var uuid = require('node-uuid');
var R = require('ramda');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  router.post('', tokenService.verify('access_token'), directives.validation.schema(schemas.circles.create), function(req, res, next) {
    if (req.user.id !== req.circlr.user_id) {
      return next(new errors.AuthenticationRequiredError());
    }

    var circle = {
      uuid: uuid.v4(),
      circlr_id: req.circlr.id,
      name: req.body.name
    };

    knexClient('circles').insert(circle).returning('id')
      .then(function(result) {
        return res.status(200).json(R.merge(circle, { id: result[0] }));
      });
  });

  router.route('/:uuid')
    .get(function(req, res, next) {
      knexClient.select('id', 'uuid', 'name', 'created_at').from('circles').where({ circlr_id: req.circlr.id, uuid: req.params.uuid }).limit(1)
        .then(function(row) {
          if (!row && row.length === 0) {
            return next(new errors.EntityNotFoundError('circle'));
          }

          return res.status(200).json(row[0]);
        });
    })
    .put(tokenService.verify('access_token'), directives.validation.schema(schemas.circles.update), function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      knexClient('circles').where({ uuid: req.params.uuid, circlr_id: req.circlr.id }).update({ name: req.body.name })
        .then(function(result) {
          return res.status(200).send({updated: true});
        });
    })
    .delete(tokenService.verify('access_token'), function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      knexClient('circles').where({ uuid: req.params.uuid, circlr_id: req.circlr.id }).returning('id').del()
        .then(function(result) {
          var circleId = result[0];
          return knexClient('circles_photos').where({ circlr_id: req.circlr.id, circle_id: circleId }).update({ circle_id: null });
        }).then(function() {
          return res.status(200).send({deleted: true});
        });
    });

  router.get('/:uuid/photos', function(req, res, next) {
    knexClient.select('photos.uuid', 'photos.description')
      .from('circles')
      .where({ uuid: req.params.uuid, circlr_id: req.circlr.id })
      .leftJoin('circles_photos', 'circles.id', 'circles_photos.circle_id')
      .innerJoin('photos', 'circles_photos.photo_id', 'photos.id')
      .then(function(rows) {
        return res.status(200).json(rows);
      });
  });

  return router;
};