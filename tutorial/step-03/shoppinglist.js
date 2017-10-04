(function () {
  'use strict'

  var model = null

  // make doc id friendlier for using as DOM node id
  var sanitize = function (id) {
    return id.replace(/[:.]/gi, '-')
  }

  // add docs to DOM node list
  var addToList = function (docs) {
    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i]

      var isList = doc.type === 'list' || doc._id.indexOf('list:') === 0
      var shoppinglists = null

      if (isList) {
        shoppinglists = document.getElementById('shopping-lists')
      } else {
        continue
      }

      doc._sanitizedid = sanitize(doc._id)

      var template = document.getElementById('shopping-list-template').innerHTML
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

      var listdiv = document.createElement('div')
      listdiv.id = doc._sanitizedid
      listdiv.className = 'card collapsible'
      listdiv.innerHTML = template

      var existingdiv = document.getElementById(doc._sanitizedid)
      if (existingdiv) {
        shoppinglists.replaceChild(listdiv, existingdiv)
      } else {
        shoppinglists.insertBefore(listdiv, shoppinglists.firstChild)
      }
    }
  }

  // remove from DOM node list
  var removeFromList = function (id) {
    var list = document.getElementById(sanitize(id))
    shopper.toggle(list)
    list.parentElement.removeChild(list)
  }

  var shopper = function (themodel) {
    if (themodel) {
      themodel(function (err, response) {
        if (err) {
          console.error(err)
        } else {
          model = response
          model.lists(function (err, docs) {
            if (err) {
              console.error(err)
            } else {
              addToList(docs, true)
            }
            console.log('shopper ready!')
          })
        }
      })
    }
    return this
  }

  shopper.openadd = function () {
    var form = document.getElementById('shopping-list-add')
    form.reset()
    document.body.className += ' ' + form.id
  }

  shopper.closeadd = function () {
    document.body.className = document.body.className.replace('shopping-list-add', '').trim()
  }

  shopper.add = function (event) {
    var form = event.target
    var elements = form.elements
    var doc = {}

    if (!elements['title'].value) {
      console.error('title required')
    } else {
      for (var i = 0; i < elements.length; i++) {
        if (elements[i].tagName.toLowerCase() !== 'button') {
          doc[elements[i].name] = elements[i].value
        }
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

  window.shopper = shopper
}())
