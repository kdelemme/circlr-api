"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  router.post('', tokenService.verify('access_token'), directives.validation.schema(schemas.circlrs.create), function(req, res, next) {
    var circlr = {name: req.body.name, user_id: req.user.id };
    if (req.body.description) {
      circlr.description = req.body.description;
    }

    return knexClient('circlrs').insert(circlr).then(function() {
      return res.status(200).json({name: req.body.name});
    }).catch(function(err) {
      return next(new errors.EntityAlreadyExistError('circlr'));
    });
  });

  router.get('/:name', function(req, res, next) {
    knexClient.select('id', 'name', 'description', 'created_at').from('circlrs').where({ name: req.params.name }).limit(1)
      .then(function(row) {
        if (!row || row.length === 0) {
          return next(new errors.EntityNotFoundError('circlr'));
        }

        return res.status(200).json(row[0]);
      });
  });

  var fetchCirclr = function fetchCirclr(req, res, next) {
    knexClient.select('id', 'name', 'user_id', 'description', 'created_at').from('circlrs').where({ name: req.params.name }).limit(1)
      .then(function(row) {
        if (!row || row.length === 0) {
          return next(new errors.EntityNotFoundError('circlr'));
        }

        req.circlr = row[0];
        return next();
      });
  };

  router.use('/:name/circles', fetchCirclr, require('./circles')(logger, config, knexClient));
  router.use('/:name/photos', fetchCirclr, require('./photos')(logger, config, knexClient));

  return router;
};