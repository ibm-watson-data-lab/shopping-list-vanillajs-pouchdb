(function () {
  'use strict'

  var model = null

  // make doc id friendlier for using as DOM node id
  var sanitize = function (id) {
    return id.replace(/[:.]/gi, '-')
  }

  /**
   * Set focus on the appropriate element in a shopping list or shopping list item DOM node
   *
   * @param  {String|DOM} node
   *         The shopping list or shopping list item DOM node to set focus
   */
  var formFocus = function (node) {
    if (typeof node === 'string') {
      node = document.getElementById(node)
    }

    if (node.className.indexOf('closed') === -1) {
      if (node.tagName.toLowerCase() === 'form') {
        // if node is a form focus get the title input field
        node = node.elements['title'] || node.elements[0]
      } else if (node.id) {
        var form = document.getElementById('form-' + node.id)
        // the expand button of the node
        var more = document.querySelector('#' + node.id + ' .collapsible:first-child:not(.closed) .more-btn')
        if (more) {
          node = more
        } else if (form) {
          node = form.elements['title'] || form.elements[0]
        }
      }
    }

    node.focus()

    // if focus set to the input field
    // move cursor to the end of the input field
    if (typeof node.selectionStart === 'number') {
      node.selectionStart = node.selectionEnd = node.value.length
    } else if (typeof nodecreateTextRange !== 'undefined') {
      node.focus()
      var range = node.createTextRange()
      range.collapse(false)
      range.select()
    }
  }

  /**
   * Add shopping list or shopping list to the page (either appending or starting with clean list node)
   *
   * @param  {Array} docs
   *         Array of shopping list or shopping list items to add to the DOM
   * @param  {Boolean} clear
   *         True, if DOM node should be cleared before adding new docs
   */
  var addToList = function (docs, clear) {
    if (clear) {
      if (document.body.getAttribute('data-list-id')) {
        document.getElementById('shopping-list-items').innerHTML = ''
      } else {
        document.getElementById('shopping-lists').innerHTML = ''
      }
    }

    // sort by updated or created date
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

      // is shopping list or shopping list item?
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

      // get and update the appropriate template for shopping list or shopping list item
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

      // create the parent DOM node and insert the template
      var listdiv = document.createElement(isItem ? 'li' : 'div')
      listdiv.id = doc._sanitizedid
      listdiv.className = 'card ' + (isItem ? 'collection-item' : 'collapsible')
      listdiv.innerHTML = template

      // replace existing DOM node or prepend to the page
      var existingdiv = document.getElementById(doc._sanitizedid)
      if (existingdiv) {
        shoppinglists.replaceChild(listdiv, existingdiv)
      } else {
        shoppinglists.insertBefore(listdiv, shoppinglists.firstChild)
      }

      // update the number of items count
      if (isItem) {
        sortItem(doc._id)
        updateItemCount(doc.list)
      } else {
        updateItemCount(doc._id)
      }
    }
  }

  /**
   * Remove the shopping list or shopping list item from the page
   *
   * @param  {String} id
   *         The id of the shopping list or shopping list item to be removed
   */
  var removeFromList = function (id) {
    // find the appropriate DOM node
    var list = document.getElementById(sanitize(id))
    // collapse the node
    shopper.toggle(list)
    // remove from parent DOM
    list.parentElement.removeChild(list)

    var listid = document.body.getAttribute('data-list-id')
    if (listid) {
      // update items count
      updateItemCount(listid)
    }
  }

  /**
   * Figure the checked items count for a shopping list and page accordingly
   *
   * @param  {String} listid
   *         The id of the shopping list to update the items count
   */
  var updateItemCount = function (listid) {
    // get the shopping list
    model.get(listid, function (err, doc) {
      if (err) {
        console.log(err)
      } else {
        // get items belonging to the shopping list
        model.items(listid, function (err, items) {
          if (err) {
            console.log(err)
          } else {
            // determine number of checked items
            var checked = 0
            for (var i = 0; i < items.length; i++) {
              checked += items[i].checked ? 1 : 0
            }
            var node = document.getElementById('checked-list-' + sanitize(listid))
            if (node) {
              // update the shopping list DOM node
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

  /**
   * Sort in place the given shopping list item
   *
   * @param  {String} id
   *         The ID of the shopping list item to sort and move
   */
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

  /**
   * Set "aria-hidden" and "tab-index" attributes accordingly when dialog is opened/closed
   *
   * @param  {Boolean} hide
   *         True, if elements should be hidden
   */
  var setAria = function (hide) {
    if (hide) {
      // find all not hidden buttons in the 'header' or 'main' DOM node
      var nodes = document.querySelectorAll('header [role="button"], main [role="button"]:not([aria-hidden="true"]), main button:not([aria-hidden="true"]), main input:not([aria-hidden="true"]), main [type="checkbox"]:not([aria-hidden="true"])')
      for (var i = 0; i < nodes.length; i++) {
        // set "aria-hidden" and "tab-index"
        nodes[i].setAttribute('aria-hidden', 'true')
        nodes[i].setAttribute('tab-index', '-1')
      }
    } else {
      // find all hidden buttons in the 'header' or 'main' DOM node
      var hiddennodes = document.querySelectorAll('main [tab-index="-1"], header [tab-index="-1"]')
      for (var j = 0; j < hiddennodes.length; j++) {
        // set "aria-hidden" and "tab-index"
        hiddennodes[j].setAttribute('aria-hidden', 'false')
        hiddennodes[j].removeAttribute('tab-index')
      }
    }
  }

  /**
   * Helper object to communicate between page actions and model object
   *
   * @param  {Object} themodel
   *         The shopping list model object to interact with
   */
  var shopper = function (themodel) {
    if (themodel) {
      // init the shopping list model
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
  }

  /**
   * Open the 'Add shopping list' or 'Add shopping list item' dialog
   */
  shopper.openadd = function () {
    var form = null
    if (document.body.getAttribute('data-list-id')) {
      form = document.getElementById('shopping-list-item-add')
    } else {
      form = document.getElementById('shopping-list-add')
    }
    form.reset()
    document.body.className += ' ' + form.id
    setAria(true)
    formFocus(form)
  }

  /**
   * Close the 'Add shopping list' or 'Add shopping list item' dialog
   */
  shopper.closeadd = function () {
    document.body.className = document.body.className
      .replace('shopping-list-add', '')
      .replace('shopping-list-item-add', '')
      .trim()
    setAria(false)
  }

  /**
   * Save the shopping list or shopping list item to the model and add to page
   *
   * @param  {Object} event
   *         Event from the submit button
   */
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

  /**
   * Delete the shopping list or shopping list item from the model and remove from page
   *
   * @param  {String} id
   *         The id of the shopping list or shopping list item
   */
  shopper.remove = function (id) {
    model.remove(id, function (err, response) {
      if (err) {
        console.log(err)
      } else {
        removeFromList(id)
      }
    })
  }

  /**
   * Update the shopping list or shopping list item in the model and in the page
   *
   * @param  {String} id
   *         The id of the shopping list or shopping list item
   */
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

  /**
   * Go to the shopping list items for a given shopping list
   *
   * @param  {String} listid
   *         The id of the shopping list
   * @param  {String} title
   *         The title of the shopping list
   * @param  {Object} event
   *         Click event that triggered the function
   */
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
      // var listId = document.body.getAttribute('data-list-id')
      // updateItemCount(listId)
      document.body.removeAttribute('data-list-id')
      document.getElementById('header-title').innerText = 'Shopping List'
    }
  }

  /**
   * Expand/Collapse the DOM node for the shopping list or shopping list item
   *
   * @param  {String|DOM} node
   *         The node to expand/collapse
   * @param  {Object} event
   *         Click event that triggered the function
   */
  shopper.toggle = function (node, event) {
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
      var buttons = document.querySelectorAll('#' + node + ' button, #' + node + ' [role="button"], #' + node + ' input')
      for (var k = 0; k < buttons.length; k++) {
        buttons[k].setAttribute('aria-hidden', buttons[k].getAttribute('aria-hidden') !== 'true')
      }
    } else {
      node.classList.toggle('closed')
      domnode = node
    }

    formFocus(domnode)
  }

  /**
   * Open the 'About' dialog
   */
  shopper.openabout = function () {
    document.body.className += ' shopping-list-about'
    setAria(true)
  }

  /**
   * Close the 'About' dialog
   */
  shopper.closeabout = function () {
    document.body.className = document.body.className.replace('shopping-list-about', '').trim()
    setAria(false)
  }

  /**
   * Open the 'Settings' dialog
   */
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
    setAria(true)
    formFocus(form)
  }

  /**
   * Close the 'Settings' dialog
   */
  shopper.closesettings = function () {
    document.body.className = document.body.className.replace('shopping-list-settings', '').trim()
    setAria(false)
  }

  /**
   * Update the settings
   *
   * @param  {Object} event
   *         Click event that triggered the function
   */
  shopper.settings = function (event) {
    var form = event.target
    var elements = form.elements
    var doc = {}
    var updated = false

    // get updated settings
    for (var i = 0; i < elements.length; i++) {
      if (elements[i].tagName.toLowerCase() !== 'button') {
        if (shopper.settings[elements[i].name] !== elements[i].value) {
          updated = true
        }
        doc[elements[i].name] = shopper.settings[elements[i].name] = elements[i].value
      }
    }

    // save the settings
    model.settings(updated ? doc : null, function (err, response) {
      if (err) {
        console.error(err)
      } else {
        shopper.sync(shopper.closesettings)
      }
    })
  }

  /**
   * Synchronize the data
   *
   * @param  {Function} callback
   *         Function to be called after syncing
   */
  shopper.sync = function (callback) {
    // sync 'complete' callback
    var complete = function (error, response) {
      document.body.className = document.body.className.replace('shopping-list-sync', '').trim()
      document.body.removeAttribute('data-list-id')

      if (error) {
        document.body.className += ' shopping-list-error-sync'
        console.error(error)
      }

      // get shopping lists
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

    // sync with remote DB
    if (shopper.settings.remoteDB) {
      document.body.className = document.body.className.replace('shopping-list-error-sync', '').trim()
      document.body.className += ' shopping-list-sync'

      // sync 'change' callback
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

  /**
   * Handle keydown action to allow using ESCAPE key to close dialogs
   *
   * @param  {Object} event
   *         Event that triggered the function
   */
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
