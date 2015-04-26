"use strict";
var express = require('express');
var directives = require('../directives');

module.exports = function(logger, config, knexClient) {
  var router = express.Router();

  router.use('/users', require('./users')(logger, config, knexClient));
  router.use('/circlrs', require('./circlrs')(logger, config, knexClient));

  return router;
};