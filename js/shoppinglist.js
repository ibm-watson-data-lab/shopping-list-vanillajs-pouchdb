
(function () {
  'use strict'

  var model = null

  // make doc id friendlier for using as DOM node id
  var sanitize = function (id) {
    return id.replace(/(:)/gi, '-')
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
      if (isItem && existingdiv) {
        shoppinglists.replaceChild(listdiv, existingdiv)
      } else {
        listdiv.className += ' closed'
        shoppinglists.insertBefore(listdiv, shoppinglists.firstChild)
      }

      if (isItem) {
        sortItem(doc._id)
      } else {
        updateItemCount(doc._id)
      }

      shopper.toggle(listdiv)
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
      model = themodel(function (err, docs) {
        if (err) {
          console.error(err)
        } else {
          console.log('shopper', docs)
          addToList(docs)
        }
      })

      shopper.model = model
    },

    add: function () {
      if (document.body.getAttribute('data-list-id')) {
        document.querySelector('#shopping-list-item-add form').reset()
        document.body.className += ' shopping-list-item-add'
      } else {
        document.querySelector('#shopping-list-add form').reset()
        document.body.className += ' shopping-list-add'
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

    save: function (id) {
      var elements = null
      var listid = document.body.getAttribute('data-list-id')
      if (id === 'shopping-list-add' || id === 'shopping-list-item-add') {
        var doc = {}
        elements = document.querySelector('#' + id + ' form').elements
        if (!elements['title'].value) {
          console.error('title required')
        } else {
          for (var i = 0; i < elements.length; i++) {
            doc[elements[i].name] = elements[i].value
          }
          doc['list'] = listid

          model.save(doc, function (err, updated) {
            if (err) {
              console.error(err)
            } else {
              doc._id = doc._id || updated._id || updated.id
              addToList([doc])
              shopper.closemodal()
            }
          })
        }
      } else {
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
                } else if (!listid) {
                  removeFromList(id)
                }
                addToList([doc])
              })
            }
          })
        }
      }
    },

    goto: function (id, title, event) {
      if (event) {
        event.stopPropagation()
      }
      if (id) {
        model.items(id, function (err, docs) {
          if (err) {
            console.error(err)
          } else {
            document.getElementById('header-title').innerText = title
            document.body.setAttribute('data-list-id', id)
            docs.sort(function (a, b) {
              return a.title < b.title
            })
            addToList(docs, true)
          }
        })
      } else {
        var listid = document.body.getAttribute('data-list-id')
        updateItemCount(listid)
        document.body.removeAttribute('data-list-id')
        document.getElementById('header-title').innerText = 'Shopping List'
      }
    },

    toggle: function (node, event) {
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
    },

    closemodal: function () {
      document.body.className = document.body.className.replace('shopping-list-item-add', '').replace('shopping-list-add', '')
    },

    handlekey: function (event, triggerid) {
      if (event) {
        if (event.currentTarget.tagName.toLowerCase() === 'body' && (event.which === 37 || event.keyCode === 37 || event.which === 39 || event.keyCode === 39)) {
          event.stopPropagation()
          event.preventDefault()
        } else {
          if (event.which === 13 || event.keyCode === 13) {
            event.stopPropagation()
            document.getElementById(triggerid).click()
          }
        }
      }
      return false
    }
  }

  window.shopper = shopper
}())
