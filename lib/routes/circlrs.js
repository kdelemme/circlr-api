"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  /**
   * Admin Create Route
   */
  router.post('', tokenService.verify('access_token'), directives.validation.schema(schemas.circlrs.create), function(req, res, next) {
    var circlr = { name: req.body.name, user_id: req.user.id };
    if (req.body.description) {
      circlr.description = req.body.description;
    }

    return knexClient('circlrs').insert(circlr).then(function() {
      return res.status(200).json({name: req.body.name});
    }).catch(function() {
      return next(new errors.EntityAlreadyExistError('circlr'));
    });
  });

  /**
   * Public Read Route
   */
  router.get('/:name', function(req, res, next) {
    knexClient.select('id', 'name', 'description').from('circlrs').where({ name: req.params.name }).limit(1)
      .then(function(row) {
        if (!row || row.length === 0) {
          return next(new errors.EntityNotFoundError('circlr'));
        }

        return res.status(200).json(row[0]);
      });
  });

  var fetchCirclr = function fetchCirclr(req, res, next) {
    var whereCriteria = {};
    if (req.params.name) {
      whereCriteria = { name: req.params.name };
    } else if (req.params.id) {
      whereCriteria = { id: req.params.id };
    } else {
      return next(new errors.MissingParameterError(['params', 'id']));
    }

    knexClient.select('id', 'name', 'user_id', 'description', 'created_at', 'updated_at').from('circlrs').where(whereCriteria).limit(1)
      .then(function(row) {
        if (!row || row.length === 0) {
          return next(new errors.EntityNotFoundError('circlr'));
        }

        req.circlr = row[0];
        return next();
      });
  };

  /**
   * Admin Update, Delete Routes
   */
  router.route('/:id')
    .all(tokenService.verify('access_token'), fetchCirclr, function(req, res, next) {
      if (req.user.id !== req.circlr.user_id) {
        return next(new errors.AuthenticationRequiredError());
      }

      next();
    })
    .put(directives.validation.schema(schemas.circlrs.update), function(req, res, next) {
      knexClient('circlrs').where({ id: req.params.id, user_id: req.user.id })
        .update({ name: req.body.name, description: req.body.description })
        .then(function(result) {
          return res.status(200).send({updated: true});
        });
    })
    .del(function(req, res, next) {
      knexClient('circlrs').where({ id: req.params.id, user_id: req.user.id }).del()
        .then(function(result) {
          return res.status(200).send({deleted: true});
        });
    });

  router.use('/:name/circles', fetchCirclr, require('./circles')(logger, config, knexClient));
  router.use('/:name/photos', fetchCirclr, require('./photos')(logger, config, knexClient));

  return router;
};