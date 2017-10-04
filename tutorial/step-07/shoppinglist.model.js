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

  // Shopping List Item Schema
  // https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-item-example
  var initItemDoc = function (doc, listid) {
    return {
      '_id': 'item:' + new Date().toISOString(),
      'type': 'item',
      'version': 1,
      'list': doc.list || listid,
      'title': doc.title,
      'checked': !!doc.checked,
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
    } else if (d.type === 'item') {
      doc = initItemDoc(d)
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
        } else if (doc.type === 'list') {
          // remove all children
          model.items(doc._id, function (err, response) {
            if (err) {
              console.error(err)
              deleteRev(doc._rev)
            } else {
              var items = response ? response.docs || response : response
              if (items && items.length) {
                var markfordeletion = items.map(function (item) {
                  item._deleted = true
                  return item
                })
                db.bulkDocs(markfordeletion, function (err, response) {
                  if (err) {
                    console.error(err)
                  }
                  deleteRev(doc._rev)
                })
              } else {
                deleteRev(doc._rev)
              }
            }
          })
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

  model.items = function (listid, callback) {
    db.find({
      selector: {
        type: 'item',
        list: listid
      }
    }, function (err, response) {
      if (typeof callback === 'function') {
        var docs = response ? response.docs || response : response
        callback(err, docs)
      }
    })
  }

  window.addEventListener('DOMContentLoaded', function () {
    window.shopper(model)
  })
}())
