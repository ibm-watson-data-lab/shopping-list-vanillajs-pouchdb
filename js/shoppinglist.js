
(function () {
  'use strict'

  var model = null

  // make doc id friendlier for using as DOM node id
  var sanitize = function (id) {
    return id.replace(/(:)/gi, '-')
  }

  // focus on title input of the form and move cursor to end of input
  var formFocus = function (node) {
    if (typeof node === 'string') {
      node = document.getElementById(node)
    }

    if (node.className.indexOf('closed') === -1) {
      if (node.tagName.toLowerCase() === 'form') {
        node = node.elements['title'] || node.elements[0]
      } else if (node.id) {
        var form = document.getElementById('form-' + node.id)
        if (form) {
          node = form.elements['title'] || form.elements[0]
        }
      }
    }

    node.focus()

    if (typeof node.selectionStart === 'number') {
      node.selectionStart = node.selectionEnd = node.value.length
    } else if (typeof nodecreateTextRange !== 'undefined') {
      node.focus()
      var range = node.createTextRange()
      range.collapse(false)
      range.select()
    }
  }

  // add docs to DOM node list (either appending or starting with clean list node)
  var addToList = function (docs, reset) {
    if (reset) {
      if (document.body.getAttribute('data-list-id')) {
        document.getElementById('shopping-list-items').innerHTML = ''
      } else {
        document.getElementById('shopping-lists').innerHTML = ''
      }
    }

    docs = docs.sort(function (a, b) {
      if (a.updatedAt || a.createdAt < b.updatedAt || b.createdAt) {
        return -1
      } else if (a.updatedAt || a.createdAt > b.updatedAt || b.createdAt) {
        return 1
      } else {
        return 0
      }
    })

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]

      var isItem = doc.type === 'item' || doc._id.indexOf('item:') === 0
      var isList = doc.type === 'list' || doc._id.indexOf('list:') === 0
      var shoppinglists = null

      if (isItem || isList) {
        shoppinglists = document.getElementById(isItem ? 'shopping-list-items' : 'shopping-lists')
      } else {
        continue
      }

      doc._sanitizedid = sanitize(doc._id)
      doc._checked = doc.checked ? 'checked="checked"' : ''

      var template = document.getElementById(isItem ? 'shopping-list-item' : 'shopping-list-template').innerHTML
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
        sortItem(doc._id)
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
  }

  // figure out the checked items count for a list
  var updateItemCount = function (listid) {
    shopper.model.get(listid, function (err, doc) {
      if (err) {
        console.log(err)
      } else {
        shopper.model.find({
          selector: {
            type: 'item',
            list: listid
          }
        }, function (err, items) {
          if (err) {
            console.log(err)
          } else {
            var checked = 0
            for (var i = 0; i < items.length; i++) {
              checked += items[i].checked ? 1 : 0
            }
            var node = document.getElementById('checked-list-' + sanitize(listid))
            if (node) {
              node.nextElementSibling.innerText = (checked + ' of ' + items.length + ' checked')
              node.checked = checked && checked === items.length
              if ((doc.checked && checked !== items.length) ||
                (!doc.checked && checked === items.length)) {
                doc.checked = checked === items.length
                shopper.model.save(doc)
              }
            }
          }
        })
      }
    })
  }

  // place/sort given item accordingly in the DOM node list
  var sortItem = function (id) {
    var li = document.getElementById(sanitize(id))
    var val = document.getElementById('checked-item-' + sanitize(id)).value
    var nodes = document.querySelectorAll('#shopping-list-items .item-view input[type="checkbox"]')
    if (val > nodes[nodes.length - 1].value) {
      li.parentNode.append(li)
    } else {
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        if (val < node.value) {
          li.parentNode.insertBefore(li, node.parentNode.parentNode)
          break
        }
      }
    }
  }

  var shopper = {
    register: function (themodel) {
      model = shopper.model = themodel(function (err, response) {
        if (err) {
          console.error(err)
        } else {
          // get settings
          model.settings(function (err, settings) {
            if (err) {
              console.error(err)
            } else {
              console.log('settings', settings)
              for (var setting in settings) {
                shopper.settings[setting] = settings[setting]
              }
              shopper.sync(function () {
                console.log('shopper ready!')
              })
            }
          })
        }
      })
    },

    openadd: function () {
      var form = null
      if (document.body.getAttribute('data-list-id')) {
        form = document.getElementById('shopping-list-item-add')
      } else {
        form = document.getElementById('shopping-list-add')
      }

      form.reset()
      document.body.className += ' ' + form.id

      formFocus(form)
    },

    closeadd: function () {
      document.body.className = document.body.className.replace('shopping-list-item-add', '').replace('shopping-list-add', '').trim()
    },

    add: function (event) {
      var form = event.target
      var elements = form.elements
      var listid = document.body.getAttribute('data-list-id')
      var doc = {}

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
    },

    remove: function (id) {
      model.get(id, function (err, doc) {
        if (err) {
          console.log(err)
        } else {
          model.remove(id, function (err, response) {
            if (err) {
              console.log(err)
            } else {
              removeFromList(id)
              // trigger a change for parent list
              if (doc.list) {
                model.get(doc.list, function (err, d) {
                  if (err) {
                    console.error(err)
                  } else {
                    model.save(d)
                  }
                })
              }
            }
          })
        }
      })
    },

    update: function (id) {
      var elements = null
      var listid = document.body.getAttribute('data-list-id')
      elements = document.getElementById('form-' + sanitize(id)).elements
      var checked = document.getElementById('checked-item-' + sanitize(id))
      if (!elements['title'].value) {
        console.error('title required')
      } else {
        model.get(id, function (err, doc) {
          if (err) {
            console.log(err)
          } else {
            doc.title = elements['title'].value
            if (listid) {
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
    },

    goto: function (listid, title, event) {
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
            docs.sort(function (a, b) {
              return a.title < b.title
            })
            addToList(docs, true)
          }
        })
      } else {
        var listId = document.body.getAttribute('data-list-id')
        updateItemCount(listId)
        document.body.removeAttribute('data-list-id')
        document.getElementById('header-title').innerText = 'Shopping List'
      }
    },

    toggle: function (node, event) {
      if (event) {
        event.stopPropagation()
      }
      var domnode = null

      if (typeof node === 'string') {
        var nodes = document.querySelectorAll('#' + node + ' .collapsible')
        domnode = document.getElementById(node)
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].classList) {
            nodes[i].classList.toggle('closed')
          }
        }
        var inputs = document.querySelectorAll('#' + node + ' .collapsible input[placeholder]')
        for (var j = 0; j < inputs.length; j++) {
          inputs[j].value = inputs[j].getAttribute('placeholder')
        }
      } else {
        node.classList.toggle('closed')
        domnode = node
      }

      formFocus(domnode)
    },

    opensettings: function () {
      var form = document.getElementById('shopping-list-settings')
      form.reset()

      for (var setting in shopper.settings) {
        if (form.elements.hasOwnProperty(setting)) {
          var input = document.querySelector('form#shopping-list-settings [name=' + setting + ']')
          input.value = shopper.settings[setting]
        }
      }

      document.body.className += ' ' + form.id
      formFocus(form)
    },

    closesettings: function () {
      document.body.className = document.body.className.replace('shopping-list-settings', '').replace('shopping-list-sync', '').trim()
    },

    settings: function (event) {
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
    },

    sync: function (callback) {
      var complete = function (error, response) {
        document.body.className = document.body.className.replace('shopping-list-sync', '').trim()
        document.body.removeAttribute('data-list-id')

        if (error) {
          document.body.className += ' shopping-list-error-sync'
          console.error(error)
        }

        shopper.model.lists(function (err, docs) {
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
  }

  document.onkeydown = function (event) {
    if (event.target.tagName.toLowerCase() === 'body' && (event.which === 37 || event.keyCode === 37 || event.which === 39 || event.keyCode === 39)) {
      event.stopPropagation()
      event.preventDefault()
    } else if (event.which === 27 || event.keyCode === 27) {
      event.stopPropagation()
      var action = event.target.getAttribute('data-escape')
      if (action) {
        if (shopper.hasOwnProperty(action)) {
          shopper[action]()
        } else {
          shopper.toggle(action)
        }
      }
    }
  }

  window.shopper = shopper
}())
