/* global PouchDB */

(function () {
  'use strict'

  // PouchDB
  var db = null

  // Shopping List Schema
  // https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-example
  var initListDoc = function (doc) {
    return {
      '_id': 'list:' + new Date().toISOString(),
      'type': 'list',
      'version': 1,
      'title': doc.title,
      'checked': !!doc.checked,
      'place': {
        'title': doc.place ? doc.place.title : '',
        'license': doc.place ? doc.place.license : '',
        'lat': doc.place ? doc.place.lat : null,
        'lon': doc.place ? doc.place.lon : null,
        'address': doc.place ? doc.place.address : {}
      },
      'createdAt': new Date().toISOString(),
      'updatedAt': ''
    }
  }

  var model = function (callback) {
    db = new PouchDB('shopping')

    db.info(function (err, info) {
      if (err) {
        console.error(err)
      } else {
        console.log('model.info', info)
      }
    })

    db.createIndex({
      index: { fields: ['type'] }
    }, function (err, response) {
      if (typeof callback === 'function') {
        console.log('model ready!')
        callback(err, model)
      }
    })
  }

  model.lists = function (callback) {
    db.find({
      selector: {
        type: 'list'
      }
    }, function (err, response) {
      if (typeof callback === 'function') {
        var docs = response ? response.docs || response : response
        callback(err, docs)
      }
    })
  }

  model.save = function (d, callback) {
    var doc = null
    if (d._id) {
      doc = d
      doc['updatedAt'] = new Date().toISOString()
    } else if (d.type === 'list') {
      doc = initListDoc(d)
    }

    if (doc) {
      db.put(doc, function (err, response) {
        if (typeof callback === 'function') {
          callback(err, response)
        }
      })
    } else {
      if (typeof callback === 'function') {
        callback(new Error('Missing or unsupport doc type'), null)
      }
    }
  }

  model.get = function (id, callback) {
    db.get(id, function (err, doc) {
      if (typeof callback === 'function') {
        callback(err, doc)
      }
    })
  }

  model.remove = function (id, callback) {
    function deleteRev (rev) {
      db.remove(id, rev, function (err, response) {
        if (typeof callback === 'function') {
          callback(err, response)
        }
      })
    }

    if (id) {
      db.get(id, function (err, doc) {
        if (err) {
          if (typeof callback === 'function') {
            callback(err, null)
          }
        } else {
          deleteRev(doc._rev)
        }
      })
    } else {
      if (typeof callback === 'function') {
        callback(new Error('Missing doc id'), null)
      }
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    window.shopper(model)
  })
}())
