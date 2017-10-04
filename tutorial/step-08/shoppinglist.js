(function () {
  'use strict'

  var model = null

  // make doc id friendlier for using as DOM node id
  var sanitize = function (id) {
    return id.replace(/[:.]/gi, '-')
  }

  // add docs to DOM node list
  var addToList = function (docs, clear) {
    if (clear) {
      if (document.body.getAttribute('data-list-id')) {
        document.getElementById('shopping-list-items').innerHTML = ''
      } else {
        document.getElementById('shopping-lists').innerHTML = ''
      }
    }
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]

      var isItem = doc.type === 'item' || doc._id.indexOf('item:') === 0
      var isList = doc.type === 'list' || doc._id.indexOf('list:') === 0
      var shoppinglists = null

      if (isList) {
        shoppinglists = document.getElementById('shopping-lists')
      } else if (isItem) {
        shoppinglists = document.getElementById('shopping-list-items')
      } else {
        continue
      }

      doc._sanitizedid = sanitize(doc._id)
      doc._checked = doc.checked ? 'checked="checked"' : ''

      var template = document.getElementById(isItem ? 'shopping-list-item-template' : 'shopping-list-template').innerHTML
      template = template.replace(/\{\{(.+?)\}\}/g, function ($0, $1) {
        var fields = ($1).split('.')
        var value = doc
        while (fields.length) {
          if (value.hasOwnProperty(fields[0])) {
            value = value[fields.shift()]
          } else {
            value = null
            break
          }
        }
        return value || ''
      })

      var listdiv = document.createElement(isItem ? 'li' : 'div')
      listdiv.id = doc._sanitizedid
      listdiv.className = 'card ' + (isItem ? 'collection-item' : 'collapsible')
      listdiv.innerHTML = template

      var existingdiv = document.getElementById(doc._sanitizedid)
      if (existingdiv) {
        shoppinglists.replaceChild(listdiv, existingdiv)
      } else {
        shoppinglists.insertBefore(listdiv, shoppinglists.firstChild)
      }

      if (isItem) {
        updateItemCount(doc.list)
      } else {
        updateItemCount(doc._id)
      }
    }
  }

  // remove from DOM node list
  var removeFromList = function (id) {
    var list = document.getElementById(sanitize(id))
    shopper.toggle(list)
    list.parentElement.removeChild(list)

    var listid = document.body.getAttribute('data-list-id')
    if (listid) {
      updateItemCount(listid)
    }
  }

  // figure out the checked items count for a list
  var updateItemCount = function (listid) {
    model.get(listid, function (err, doc) {
      if (err) {
        console.log(err)
      } else {
        model.items(listid, function (err, items) {
          if (err) {
            console.log(err)
          } else {
            var checked = 0
            for (var i = 0; i < items.length; i++) {
              checked += items[i].checked ? 1 : 0
            }
            var node = document.getElementById('checked-list-' + sanitize(listid))
            if (node) {
              node.nextElementSibling.innerText = items.length ? (checked + ' of ' + items.length + ' items checked') : '0 items'
              node.checked = checked && checked === items.length
              if ((doc.checked && checked !== items.length) ||
                (!doc.checked && checked === items.length)) {
                doc.checked = checked === items.length
                model.save(doc)
              }
            }
          }
        })
      }
    })
  }

  var shopper = function (themodel) {
    if (themodel) {
      themodel(function (err, response) {
        if (err) {
          console.error(err)
        } else {
          model = response
          // get settings
          model.settings(function (err, settings) {
            if (err) {
              console.error(err)
            } else {
              console.log('settings', settings)
              for (var setting in settings) {
                shopper.settings[setting] = settings[setting]
              }
            }
            // sync data
            shopper.sync(function () {
              console.log('shopper ready!')
            })
          })
        }
      })
    }
    return this
  }

  shopper.openadd = function () {
    var form = null
    if (document.body.getAttribute('data-list-id')) {
      form = document.getElementById('shopping-list-item-add')
    } else {
      form = document.getElementById('shopping-list-add')
    }
    form.reset()
    document.body.className += ' ' + form.id
  }

  shopper.closeadd = function () {
    document.body.className = document.body.className
      .replace('shopping-list-add', '')
      .replace('shopping-list-item-add', '')
      .trim()
  }

  shopper.add = function (event) {
    var form = event.target
    var elements = form.elements
    var doc = {}
    var listid = document.body.getAttribute('data-list-id')

    if (!elements['title'].value) {
      console.error('title required')
    } else if (listid && form.id.indexOf('list-item') === -1) {
      console.error('incorrect form')
    } else if (!listid && form.id.indexOf('list-item') > -1) {
      console.error('list id required')
    } else {
      for (var i = 0; i < elements.length; i++) {
        if (elements[i].tagName.toLowerCase() !== 'button') {
          doc[elements[i].name] = elements[i].value
        }
      }

      if (listid) {
        doc['list'] = listid
      }

      model.save(doc, function (err, updated) {
        if (err) {
          console.error(err)
        } else {
          doc._id = doc._id || updated._id || updated.id
          addToList([doc])
          shopper.closeadd()
        }
      })
    }
  }

  shopper.remove = function (id) {
    model.remove(id, function (err, response) {
      if (err) {
        console.log(err)
      } else {
        removeFromList(id)
      }
    })
  }

  shopper.update = function (id) {
    var elements = document.getElementById('form-' + sanitize(id)).elements
    if (!elements['title'].value) {
      console.error('title required')
    } else {
      model.get(id, function (err, doc) {
        if (err) {
          console.log(err)
        } else {
          doc.title = elements['title'].value
          if (document.body.getAttribute('data-list-id')) {
            var checked = document.getElementById('checked-item-' + sanitize(id))
            doc.checked = checked ? !!checked.checked : false
          }
          model.save(doc, function (err, updated) {
            if (err) {
              console.error(err)
            } else {
              addToList([doc])
            }
          })
        }
      })
    }
  }

  shopper.toggle = function (node, event) {
    if (event) {
      event.stopPropagation()
    }
    if (typeof node === 'string') {
      var nodes = document.querySelectorAll('#' + node + ' .collapsible')
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].classList) {
          nodes[i].classList.toggle('closed')
        }
      }
    } else {
      node.classList.toggle('closed')
    }
  }

  shopper.goto = function (listid, title, event) {
    if (event) {
      event.stopPropagation()
    }
    if (listid) {
      model.items(listid, function (err, docs) {
        if (err) {
          console.error(err)
        } else {
          document.getElementById('header-title').innerText = title
          document.body.setAttribute('data-list-id', listid)
          document.body.scrollTop = 0
          document.documentElement.scrollTop = 0
          docs.sort(function (a, b) {
            return a.title < b.title
          })
          addToList(docs, true)
        }
      })
    } else {
      document.body.removeAttribute('data-list-id')
      document.getElementById('header-title').innerText = 'Shopping List'
    }
  }

  shopper.opensettings = function () {
    var form = document.getElementById('shopping-list-settings')
    form.reset()

    for (var setting in shopper.settings) {
      if (form.elements.hasOwnProperty(setting)) {
        var input = document.querySelector('form#shopping-list-settings [name=' + setting + ']')
        input.value = shopper.settings[setting]
      }
    }

    document.body.className += ' ' + form.id
  }

  shopper.closesettings = function () {
    document.body.className = document.body.className.replace('shopping-list-settings', '').trim()
  }

  shopper.settings = function (event) {
    var form = event.target
    var elements = form.elements
    var doc = {}
    var updated = false

    for (var i = 0; i < elements.length; i++) {
      if (elements[i].tagName.toLowerCase() !== 'button') {
        if (shopper.settings[elements[i].name] !== elements[i].value) {
          updated = true
        }
        doc[elements[i].name] = shopper.settings[elements[i].name] = elements[i].value
      }
    }

    model.settings(updated ? doc : null, function (err, response) {
      if (err) {
        console.error(err)
      } else {
        shopper.sync(shopper.closesettings)
      }
    })
  }

  shopper.sync = function (callback) {
    var complete = function (error, response) {
      document.body.className = document.body.className.replace('shopping-list-sync', '').trim()
      document.body.removeAttribute('data-list-id')

      if (error) {
        document.body.className += ' shopping-list-error-sync'
        console.error(error)
      }

      model.lists(function (err, docs) {
        if (err) {
          console.error(err)
        } else {
          addToList(docs, true)
        }
        if (typeof callback === 'function' && !error) {
          callback()
        }
      })
    }

    if (shopper.settings.remoteDB) {
      document.body.className = document.body.className.replace('shopping-list-error-sync', '').trim()
      document.body.className += ' shopping-list-sync'
      var change = function (err, docs) {
        if (err) {
          document.body.className += ' shopping-list-error-sync'
          console.error(err)
        } else {
          if (document.body.className.indexOf('shopping-list-error-sync') !== -1) {
            document.body.className = document.body.className.replace('shopping-list-error-sync', '').trim()
          }
          var updates = []
          for (var i = 0; i < docs.length; i++) {
            if (docs[i]._deleted) {
              removeFromList(docs[i]._id)
            } else {
              updates.push(docs[i])
            }
          }
          addToList(updates)
        }
      }
      model.sync(shopper.settings.remoteDB, complete, change)
    } else {
      model.sync(null, complete)
    }
  }

  window.shopper = shopper
}())
