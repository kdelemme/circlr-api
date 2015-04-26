"use strict";
var config  = require('../config/config');
var knex = require('knex')(config.database);

knex.schema.hasTable('users')
  .then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('users', function(t) {
        t.bigIncrements('id').primary();
        t.string('email', 100).index('users_email_idx');
        t.string('password', 255);
        t.dateTime('created_at').defaultTo(knex.raw('now()'));
        t.dateTime('updated_at').defaultTo(knex.raw('now()'));
      });
    } else {
      console.log('users table already exists.');
    }
  }).then(function() {
    return knex.schema.hasTable('tokens').then(function (exists) {
      if (!exists) {
        return knex.schema.createTable('tokens', function (t) {
          t.bigIncrements('id').primary();
          t.biginteger('user_id').references('id').inTable('users');
          t.string('token', 255).index('tokens_token_idx');
          t.dateTime('expiry');
          t.dateTime('created_at').defaultTo(knex.raw('now()'));
          t.dateTime('updated_at').defaultTo(knex.raw('now()'));
        });
      } else {
        console.log('tokens table already exists.');
      }
    });
  }).then(function() {
    return knex.schema.hasTable('circlrs').then(function (exists) {
      if (!exists) {
        return knex.schema.createTable('circlrs', function (t) {
          t.bigIncrements('id').primary();
          t.string('name', 20).unique().index('circlrs_name_idx');
          t.string('description', 255);
          t.biginteger('user_id').references('id').inTable('users');
          t.dateTime('created_at').defaultTo(knex.raw('now()'));
          t.dateTime('updated_at').defaultTo(knex.raw('now()'));
        });
      } else {
        console.log('circlrs table already exists.');
      }
    });
  }).then(function() {
    return knex.schema.hasTable('circles').then(function (exists) {
      if (!exists) {
        return knex.schema.createTable('circles', function (t) {
          t.bigIncrements('id').primary();
          t.uuid('uuid').unique().index('circles_uuid_idx');
          t.biginteger('circlr_id').references('id').inTable('circlrs');
          t.string('name', 50);
          t.dateTime('created_at').defaultTo(knex.raw('now()'));
          t.dateTime('updated_at').defaultTo(knex.raw('now()'));
        });
      } else {
        console.log('circles table already exists.');
      }
    });
  }).then(function() {
    return knex.schema.hasTable('photos').then(function (exists) {
      if (!exists) {
        return knex.schema.createTable('photos', function (t) {
          t.bigIncrements('id').primary();
          t.uuid('uuid').unique().index('photos_uuid_idx');
          t.biginteger('circlr_id').references('id').inTable('circlrs');
          t.string('description', 100);
          t.dateTime('created_at').defaultTo(knex.raw('now()'));
          t.dateTime('updated_at').defaultTo(knex.raw('now()'));
        });
      } else {
        console.log('photos table already exists.');
      }
    });
  }).then(function() {
    return knex.schema.hasTable('circles_photos').then(function (exists) {
      if (!exists) {
        return knex.schema.createTable('circles_photos', function (t) {
          t.bigInteger('circle_id').references('id').inTable('circles');
          t.bigInteger('photo_id').references('id').inTable('photos');
          t.bigInteger('circlr_id').references('id').inTable('circlrs');
          t.primary(['circle_id', 'photo_id', 'circlr_id']);
        });
      } else {
        console.log('circles_photos table already exists.');
      }
    });
  }).then(function() {
    process.exit(1);
  });