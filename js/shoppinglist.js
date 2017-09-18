
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
        node = node.elements['title']
      } else if (node.id) {
        var form = document.getElementById('form-' + node.id)
        if (form) {
          node = form.elements['title']
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
    var isItem = !!document.body.getAttribute('data-list-id')
    var shoppinglists = document.getElementById(isItem ? 'shopping-list-items' : 'shopping-lists')
    if (reset) {
      shoppinglists.innerHTML = ''
    }
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]

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
  var updateItemCount = function (id) {
    shopper.model.get(id, function (err, doc) {
      if (err) {
        console.log(err)
      } else {
        shopper.model.find({
          selector: {
            type: 'item',
            list: id
          }
        }, function (err, items) {
          if (err) {
            console.log(err)
          } else {
            var checked = 0
            for (var i = 0; i < items.length; i++) {
              checked += items[i].checked ? 1 : 0
            }
            if (items[0]) {
              var node = document.getElementById('checked-list-' + sanitize(items[0].list))
              node.nextElementSibling.innerText = (checked + ' of ' + items.length + ' checked')
              node.checked = checked === items.length
              doc.checked = checked === items.length
              shopper.model.save(doc)
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
      model = shopper.model = themodel(function (err, docs) {
        if (err) {
          console.error(err)
        } else {
          console.log('shopper', docs)
          addToList(docs)
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
      document.body.className = document.body.className.replace('shopping-list-item-add', '').replace('shopping-list-add', '')
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
          doc[elements[i].name] = elements[i].value
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
      model.remove(id, function (err, response) {
        if (err) {
          console.log(err)
        } else {
          removeFromList(id)
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
