"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  router.post('', tokenService.validateToken('access_token'), directives.validation.schema(schemas.circlrs.create), function(req, res, next) {
    knexClient.select('name').from('circlrs').where({ name: req.body.name }).limit(1)
      .then(function(rows) {
        if (rows && rows.length > 0) {
          return next(new errors.EntityAlreadyExistError('circlr'));
        }
        else {
          var circlr = {name: req.body.name};
          if (req.body.description) {
            circlr.description = req.body.description;
          }

          return knexClient('circlrs').insert(circlr).then(function() {
            return res.status(200).json({name: req.body.name});
          });
        }
      });
  });

  // TODO Get list of public photos
  router.get('/:name', function(req, res, next) {
    knexClient.select('name', 'description').from('circlrs').where({ name: req.body.name }).limit(1)
      .then(function(rows) {
        if (rows && rows.length > 0) {
          return next(new errors.EntityNotFoundError('circlr'));
        }
        else {
          return res.status(200).send();
        }
      });
  });

  router.use('/:uid/circles', require('./circles')(logger, config, knexClient));
  router.use('/:uid/photos', require('./photos')(logger, config, knexClient));

  return router;
};