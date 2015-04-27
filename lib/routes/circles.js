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

    knexClient('circles').insert(circle).returning('id').then(function(result) {
      res.status(200).json(R.merge(circle, {id: result[0]}));
    });
  });

  router.get('/:uuid', function(req, res, next) {
    knexClient.select('id', 'uuid', 'name').from('circles').where({circlr_id: req.circlr.id, uuid: req.params.uuid }).limit(1)
      .then(function(rows) {
        if (rows && rows.length === 1) {
          return res.status(200).json(rows[0]);
        } else {
          return next(new errors.EntityNotFoundError('circle'));
        }
      });
  });

  router.delete('/:uuid', tokenService.verify('access_token'), function(req, res, next) {
    if (req.user.id !== req.circlr.user_id) {
      return next(new errors.AuthenticationRequiredError());
    }

    // TODO Delete from circles_photos table: set circle_id to NULL

    knexClient('circles').where({uuid: req.params.uuid, circlr_id: req.circlr.id }).del()
      .then(function(result) {
        return res.status(200).send();
      });
  });

  router.get('/:uuid/photos', function(req, res, next) {
    // TODO Fetch photos belonging to this circles + req.circlr.id
    res.status(200).json();
  });

  return router;
};