"use strict";
function AuthenticationRequiredError() {
  this.status = 401;
  this.name = 'AuthenticationRequiredError';
  this.message = 'Invalid or missing token, or you don\'t have access to this ressource.';
}
AuthenticationRequiredError.prototype = Error.prototype;

module.exports = AuthenticationRequiredError;