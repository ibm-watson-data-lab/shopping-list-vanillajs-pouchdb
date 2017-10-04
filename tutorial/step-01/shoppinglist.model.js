/* global PouchDB */

(function () {
  'use strict'

  // PouchDB
  var db = null

  var model = function (callback) {
    db = new PouchDB('shopping')
    if (typeof callback === 'function') {
      console.log('model ready!')
      callback(null, model)
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    window.shopper(model)
  })
}())
