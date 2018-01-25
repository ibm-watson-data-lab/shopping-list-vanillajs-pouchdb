/* global cuid, PouchDB */

(function () {
  'use strict'

  // PouchDB
  var db = null
  var dbsync = null

  /**
   * Create a shopping list object corresponding to the Shopping List Schema
   * https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-example
   *
   * @param  {Object} doc
   *         Properties of the shopping list
   * @return {Object}
   *         The document to store in the DB
   */
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

  /**
   * Create a shopping list item object corresponding to the Shopping List Item Schema
   * https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-item-example
   *
   * @param  {Object} doc
   *         Properties of the shopping list item
   * @param  {String} listid
   *         The ID of the parent shopping list
   * @return {Object}
   *         The document to store in the DB
   */
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

  /**
   * Log and handle responses from DB requests
   *
   * @param  {Object} error
   *         Any error in handling the request
   * @param  {Object} response
   *         The response from the request
   * @param  {Function} callback
   *         Callback function to be called
   * @param  {String} caller
   *         Name or unique identifier of the initial calling function (for logging purproses)
   */
  var handleResponse = function (error, response, callback, caller) {
    if (console) {
      console[error ? 'error' : 'log']((caller || ''), (error || response))
    }
    if (typeof callback === 'function') {
      callback((error ? error.message || error : error), response)
    }
  }

  /**
   * Initiates the shopping list model object (creates DB and index)
   *
   * @param  {Function} callback
   *         The function to be called once model is initiated or fails initiation
   */
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

  /**
   * Finds all shopping lists in the DB
   *
   * @param  {Function} callback
   *         The function to be called with the reponse
   */
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

  /**
   * Store the shopping list doc or shopping list item doc into the DB
   *
   * @param  {Object} d
   *         The shopping list or shopping list item to be stored
   * @param  {Function} callback
   *         The function to be called with the reponse
   */
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

  /**
   * Retrieve a shopping list or shopping list item from the DB
   *
   * @param  {String} id
   *         The ID of shopping list or shopping list item to be retrieved
   * @param  {Function} callback
   *         The function to be called with the reponse
   */
  model.get = function (id, callback) {
    db.get(id, function (err, doc) {
      handleResponse(err, doc, callback, 'model.get')
    })
  }

  /**
   * Delete a shopping list or shopping list item from the DB
   *
   * @param  {String} id
   *         The ID of shopping list or shopping list item to be deleted
   * @param  {Function} callback
   *         The function to be called with the reponse
   */
  model.remove = function (id, callback) {
    // delet doc using with the given id and revision
    function deleteRev (rev) {
      db.remove(id, rev, function (err, response) {
        handleResponse(err, response, callback, 'model.remove')
      })
    }

    if (id) {
      // get the doc to be deleted
      db.get(id, function (err, doc) {
        if (err) {
          handleResponse(err, doc, callback, 'model.remove.get')
        } else if (doc.type === 'list') {
          // 1. get all shopping list items belonging to the shopping list
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
                // 2. delete all shopping list items
                db.bulkDocs(markfordeletion, function (err, response) {
                  if (err) {
                    console.error('model.remove.bulkDocs', err)
                  }
                  // 3. delete shopping list
                  deleteRev(doc._rev)
                })
              } else {
                // delete shopping list
                deleteRev(doc._rev)
              }
            }
          })
        } else {
          // delete shopping lsit
          deleteRev(doc._rev)
        }
      })
    } else {
      handleResponse(new Error('Missing id'), null, callback, 'model.remove')
    }
  }

  /**
   * Find all shopping list items in the DB for a given shopping list
   *
   * @param  {String} listid
   *         The ID of shopping list to find the items for
   * @param  {Function} callback
   *         The function to be called with the reponse
   */
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

  /**
   * Get or set the settings for the shopping list app
   *
   * @param  {Object} settings
   *         The settings to be stored in the DB (or null if retrieving settings)
   * @param  {Function} callback
   *         The function to be called with the reponse
   */
  model.settings = function (settings, callback) {
    var id = '_local/user'
    var cb = callback || settings
    if (callback && settings && typeof settings === 'object') {
      // 1. get existing settings from DB
      db.get(id, function (err, doc) {
        settings._id = id
        if (err) {
          console.error(err)
        } else {
          // 2. update revision
          settings._rev = doc._rev
        }
        // 3. store new settings in DB
        db.put(settings, function (err, response) {
          handleResponse(err, response, cb, 'model.settings.put')
        })
      })
    } else {
      // get existing settings
      db.get(id, function (err, doc) {
        handleResponse(err, doc, cb, 'model.settings.get')
      })
    }
  }

  /**
   * Synchronize local DB with remote DB
   *
   * @param  {String} remoteDB
   *         The fully qualified URL for the remote DB
   * @param  {Function} oncomplete
   *         The function to be called when sync 'complete' event is received
   * @param  {Function} onchange
   *         The function to be called when sync 'change' event is received
   */
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
