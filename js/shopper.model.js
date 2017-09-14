/* global cuid, PouchDB */

(function () {
  'use strict'

  // Shopping List Schema
  // https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-example
  var initListDoc = function (doc) {
    return {
      '_id': 'list:' + cuid(),
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

  // Shopping List Item Schema
  // https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-item-example
  var initItemDoc = function (doc, listid) {
    return {
      '_id': 'item:' + cuid(),
      'type': 'item',
      'version': 1,
      'list': doc.list || listid,
      'title': doc.title,
      'checked': !!doc.checked,
      'createdAt': new Date().toISOString(),
      'updatedAt': ''
    }
  }

  var handleResponse = function (error, response, callback, caller) {
    if (console) {
      console[error ? 'error' : 'log']((caller || ''), (error || response))
    }
    if (typeof callback === 'function') {
      callback((error ? error.message || error : error), response)
    }
  }

  // PouchDB
  var db = null

  var model = function (dbname, callback) {
    var name = callback && dbname ? dbname : 'shopping'
    var cb = callback || dbname

    db = new PouchDB(name || 'shopping')
    model.db = db

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
      if (err) {
        handleResponse(err, response, cb, 'model.db.createIndex')
      } else {
        console.log('model.createIndex', response)
        model.lists(cb)
      }
    })

    return model
  }

  model.save = function (d, callback) {
    var doc = null
    if (d._id) {
      doc = d
      doc['updatedAt'] = new Date().toISOString()
    } else if (d.type === 'list') {
      doc = initListDoc(d)
    } else if (d.type === 'item') {
      doc = initItemDoc(d)
    }

    if (doc) {
      db.put(doc, function (err, response) {
        handleResponse(err, response, callback, 'model.save')
      })
    } else {
      handleResponse(new Error('Missing or unsupport doc type'), null, callback, 'model.save')
    }
  }

  model.get = function (id, callback) {
    db.get(id, function (err, doc) {
      handleResponse(err, doc, callback, 'model.get')
    })
  }

  model.remove = function (id, callback) {
    if (id) {
      db.get(id, function (err, doc) {
        if (err) {
          handleResponse(err, doc, callback, 'model.remove.get')
        } else {
          if (doc.type === 'list') {
            // remove all children
            model.items(doc._id, function (err, response) {
              if (err) {
                handleResponse(err, doc, callback, 'model.remove.items')
              } else {
                var docs = response ? response.docs || response : response
                for (var i in docs) {
                  model.remove(docs[i]._id)
                }
              }
            })
          }
          db.remove(id, doc._rev, function (err, response) {
            handleResponse(err, response, callback, 'model.remove')
          })
        }
      })
    } else {
      handleResponse(new Error('Missing id'), null, callback, 'model.remove')
    }
  }

  model.lists = function (callback) {
    db.find({
      selector: {
        type: 'list'
      }
    }, function (err, response) {
      var docs = response ? response.docs || response : response
      handleResponse(err, docs, callback, 'model.lists')
    })
  }

  model.items = function (listid, callback) {
    db.find({
      selector: {
        type: 'item',
        list: listid
      }
    }, function (err, response) {
      var docs = response ? response.docs || response : response
      handleResponse(err, docs, callback, 'model.items')
    })
  }

  model.find = function (selector, callback) {
    db.find(selector, function (err, response) {
      var docs = response ? response.docs || response : response
      handleResponse(err, docs, callback, 'model.find')
    })
  }

  window.addEventListener('DOMContentLoaded', function () {
    window.shopper.register(model)
  })
}())
