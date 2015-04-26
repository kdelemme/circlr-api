"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  router.post('', tokenService.validateToken('access_token'), function(req, res, next) {
    res.status(200).json();
  });

  router.get('/:uid', function(req, res, next) {
    res.status(200).json();
  });

  router.use('/:uid/circles', require('./circles')(logger, config, knexClient));
  router.use('/:uid/photos', require('./photos')(logger, config, knexClient));

  return router;
};