/* global cuid, PouchDB */

(function () {
  'use strict'

  // PouchDB
  var db = null
  var dbsync = null

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
      handleResponse(err, model, callback, 'model.db.createIndex')
    })
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
    function deleteRev (rev) {
      db.remove(id, rev, function (err, response) {
        handleResponse(err, response, callback, 'model.remove')
      })
    }

    if (id) {
      db.get(id, function (err, doc) {
        if (err) {
          handleResponse(err, doc, callback, 'model.remove.get')
        } else if (doc.type === 'list') {
          // remove all children
          model.items(doc._id, function (err, response) {
            if (err) {
              console.error('model.remove.items', err)
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
                    console.error('model.remove.bulkDocs', err)
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
      handleResponse(new Error('Missing id'), null, callback, 'model.remove')
    }
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

  model.settings = function (settings, callback) {
    var id = '_local/user'
    var cb = callback || settings
    if (callback && settings && typeof settings === 'object') {
      db.get(id, function (err, doc) {
        settings._id = id
        if (err) {
          console.error(err)
        } else {
          settings._rev = doc._rev
        }
        db.put(settings, function (err, response) {
          handleResponse(err, response, cb, 'model.settings.put')
        })
      })
    } else {
      db.get(id, function (err, doc) {
        handleResponse(err, doc, cb, 'model.settings.get')
      })
    }
  }

  model.sync = function (remoteDB, oncomplete, onchange) {
    if (dbsync) {
      dbsync.cancel()
    }

    if (remoteDB) {
      // do one-off sync from the server until completion
      db.sync(remoteDB)
        .on('complete', function (info) {
          handleResponse(null, info, oncomplete, 'model.sync.complete')

          // then two-way, continuous, retriable sync
          dbsync = db.sync(remoteDB, { live: true, retry: true })
            .on('change', function (info) {
              // incoming changes only
              if (info.direction === 'pull' && info.change && info.change.docs) {
                handleResponse(null, info.change.docs, onchange, 'model.sync.change')
              }
            })
            .on('error', function (err) {
              handleResponse(err, null, onchange, 'model.sync.change.error')
            })
        })
        .on('error', function (err) {
          handleResponse(err, null, oncomplete, 'model.sync.error')
        })
    } else if (typeof oncomplete === 'function') {
      oncomplete()
    }
  }

  window.addEventListener('DOMContentLoaded', function () {
    window.shopper(model)
  })
}())
