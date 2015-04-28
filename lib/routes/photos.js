"use strict";
var express = require('express');
var errors = require('../errors');
var directives = require('../directives');
var schemas = require('../schemas');

module.exports = function (logger, config, knexClient) {
  var router = express.Router();
  var tokenService = directives.token(logger, knexClient);

  router.post('', tokenService.verify('access_token'), function(req, res, next) {
    if (req.user.id !== req.circlr.user_id) {
      return next(new errors.AuthenticationRequiredError());
    }

    console.log(req.files);

    res.status(200).json();
  });

  // TODO Return photo with that uuid + req.circlr.id
  router.get('/:uuid', function(req, res, next) {
    res.status(200).json();
  });

  return router;
};