# Shopping List with Vanilla JS & PouchDB Tutorial

This document describes how to build your own Offline First shopping list app with vanilla JavaScript and PouchDB in a step-by-step tutorial.

## Table of Contents

* [Prerequisite Knowledge & Skills](#prerequisite-knowledge--skills)
* [Key Concepts](#key-concepts)
* [Initial Set Up](#initial-set-up)
* [Creating the Vanilla JS App](#creating-the-vanilla-javascript-app)
* [PouchDB Database](#the-pouchdb-database)
* [Making a PWA](#making-a-pwa)
* [Syncing Data](#syncing-data)
* [Summary](#summary)
* [Resources](#resources)

## Prerequisite Knowledge & Skills

A working knowledge of HTML, CSS, and JavaScript is required. This is not a tutorial to learn JavaScript, CSS, or HTML, therefore, some language specific concepts may be used but not discussed in detail.

You'll also need a modern web browser, such as Google Chrome, which includes web developer tools. It is helpful to know how to use the the web developer tools to debug your app as you develop it.

## Key Concepts

The shopping list app is a small single page web application consisting of an HTML file, a couple CSS files, and a couple JavaScript files, the PouchDB library but no other JavaScript frameworks (i.e., jQuery, Ember.js, etc.). The web page will allow multiple shopping lists to be created (e.g., Groceries, Clothes, etc.) each with a number of shopping list items associated with them (e.g., Bread, Water, etc.).

*Persistance* of the shopping lists and items will be achieved using the in-browser database [PouchDB](https://pouchdb.com/). This will allow your data to survive between sessions, when disconnected, and also allow the data to be synced to the cloud and thus shared across devices.

At the end of the tutorial you will have created a [Progressive Web App](https://developers.google.com/web/progressive-web-apps/), an enhanced website that can be _installed_ on a mobile device and can then be used with or without an internet connection.

## Initial Set Up

> **Note**: It is recommended you have a code editor (e.g., [Visual Studio Code](https://code.visualstudio.com/)) and web server (e.g., [Web Server for Chrome](https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb)) for working on your web app.

Much of the shopping list app's styling will be provided via [Materialize CSS](http://materializecss.com/getting-started.html), but an additional CSS file (`shoppinglist.css`) will be used for tweaking and replacing some of the styles. Materialize's accompanying JavaScript file will not be used. However, two separate JavaScript files- `shoppinglist.model.js` (to handle the storing, updating, etc of data) and `shoppinglist.js` (to control the app and define some of the logic) will be used, along with the [PouchDB](https://pouchdb.com/download.html) JavaScript library.

> **Note**: When viewing the code snippets, some previously entered content may be intentionally omitted and replaced with `...` for readability. Refer to the referenced file in the corresponding tutorial step to see the full content.

1. Create a new directory for your app
1. Create the [`index.html`](step-01/index.html) and add the initial HTML markup for your app. In the HTML, include the required JavaScript, CSS, fonts, and icons, along with the page's metadata. The HTML body contains the app's banner and a content area which is divided into two regions (i.e., shopping lists and shopping list items):

	```html
	<!doctype html>
	<html lang="en">
	  <head>
	    <meta charset="utf-8">
	    <meta name="application-name" content="Shopping List">
	    <meta name="description" content="An Offline First demo of a shopping list using vanilla JavaScript and PouchDB">
	    <meta name="keywords" content="Offline First,HTML,CSS,XML,JavaScript,PouchDB">
	    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
	
	    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
	    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700">
	    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
	    <link rel="stylesheet" href="shoppinglist.css">
	
	    <title>Shopping List | vanilla JavaScript | PouchDB</title>
	  </head>
	  <body>
	    <!-- banner -->
	    <header class="navbar-fixed">
	      <nav id="nav" class="primary-color">
	        <div class="nav-wrapper">
	          <span class="brand-logo left">
	            <span id="header-title">Shopping Lists</span>
	          </span>
	        </div>
	      </nav>
	    </header>
	
	    <!-- content area -->
	    <main>
	      <div id="shopping-lists">
	        <!-- shopping lists get inserted here -->
	      </div>
	
	      <ul id="shopping-list-items" class="collection">
	        <!-- shopping list items get inserted here -->
	      </ul>
	    </main>
	
	    <script src="https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.min.js"></script>
	    <script src="shoppinglist.js"></script>
	    <script src="shoppinglist.model.js"></script>
	  </body>
	</html>
	```

1. Create the [`shoppinglist.css`](step-01/shoppinglist.css) for styling/customizing your app's look:

	```css
	body {
	  background-color: #E1E2E1;
	  box-shadow: none !important;
	  overflow-x: hidden;
	}
	
	body * {
	  box-shadow: none !important;
	}
	
	.primary-color {
	  background-color: #52647A !important;
	}
	
	.primary-color * {
	  color: #FFFFFF !important;
	}
	
	nav .nav-wrapper {
	  padding-left: 10px;
	}
	
	main {
	  display: flex;
	  margin: 0 auto 75px auto;
	  width: 200vw;
	}
	
	#shopping-lists,
	#shopping-list-items  {
	  display: inline-block;
	  flex: 1;
	  margin: 0;
	  padding: 0;
	  transition-property: transform;
	  transition-duration: 0.5s;
	}
	
	#shopping-list-items {
	  background-color: #FFFFFF;
	  border: 0 none;
	  vertical-align: top;
	}
	```

1. Create the [`shoppinglist.js`](step-01/shoppinglist.js) for controlling the app and defining the app's logic. It exposes a single variable (`shopper`), to the `window` namespace, which is called by passing in the model:

	```js
	(function () {
	  'use strict'
	
	  var model = null
	
	  var shopper = function (themodel) {
	    if (themodel) {
	      themodel(function (err, response) {
	        if (err) {
	          console.error(err)
	        } else {
	          model = response
	          console.log('shopper ready!')
	        }
	      })
	    }
	    return this
	  }
	
	  window.shopper = shopper
	}())
	```

1. Create the [`shoppinglist.model.js`](step-01/shoppinglist.model.js) for data handling. When the DOM is loaded a call gets made to `shopper` passing in the model. The model instantiates an instance of `PouchDB` when it is called:

	```js
	(function () {
	  'use strict'
	
	  // PouchDB
	  var db = null
	
	  var model = function (callback) {
	    db = new PouchDB('shopping')
	    if (typeof callback === 'function') {
	      console.log('model ready!')
	      callback(null, model)
	    }
	  }
	
	  window.addEventListener('DOMContentLoaded', function () {
	    window.shopper(model)
	  })
	}())
	```

1. Point your web server to your app directory and start it up. If you want to use the **Web Server for Chrome** (and have installed it from the Chrome Web Store)
    1. Go to your Chrome browser's [Apps](chrome://apps/) page
    2. Click on the **Web Server**
    3. From the Web Server, click **CHOOSE FOLDER** and select you app's directory
    4. Start the Web Server
    5. Go to the **Web Server URL(s)** shown

1. You should see the basic shell of the application. Your code should be similar to [Tutorial - Step 1](step-01) and your app should resemble this:

    ![Step 1 screenshot](resources/step-01.png)

## Creating the Vanilla JavaScript App

### Creating a Shopping List

The first thing you want to be able to do with a shopping list app is to create new shopping lists. To achieve this, you should have an add button which launches a form to fill out with the shopping list title and then submit the form to actually create the list.

1. Update [`index.html`](step-02/index.html) to have an **Add** button, the **Create a Shopping List** form, and the template to represent a single shopping list. In addition, the `PouchDB` `find` plugin is also needed for improved searching of the database:

	```html
	<!doctype html>
	<html lang="en">
	...
	<main>
	
	  ...
	
	  <!-- add more stuff button -->
	  <button id="add-button" class="btn-floating btn-large secondary-color right" onclick="shopper.openadd()">
	    <i class="material-icons">add</i>
	  </button>
	
	</main>
	
	<!-- modal: add a shopping list form -->
	<div class="modal bottom-sheet list-bottom-sheet">
	  <form id="shopping-list-add" class="col s12 white" onsubmit="shopper.add(event); return false">
	    <div class="modal-content">
	      <h5>Create a Shopping List</h5>
	      <div class="row">
	        <div class="input-field col s12">
	          <input name="title" type="text" class="validate" placeholder="Enter a title for the shopping list" required />
	        </div>
	        <input name="type" type="hidden" value="list">
	      </div>
	    </div>
	    <div class="modal-footer primary-color">
	      <button class="btn-flat" type="button" onclick="shopper.closeadd()">Cancel</button>
	      <button class="btn-flat" type="submit">Add</button>
	    </div>
	  </form>
	</div>
	    
	<!-- modal: overlay -->
	<div class="modal-overlay" onclick="shopper.closeadd()"></div>
	    
	<!-- template: shopping list -->
	<script type="text/template" id="shopping-list-template">
	  <div class="list-view">
	    <div class="card-content">
	      <span class="card-title activator">{{title}}</span>
	    </div>
	  </div>
	</script>
	
	<script src="https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.find.min.js"></script>
	    
	...
	
	</html>
	```
  
1. Append the styling for the button and form to the [`shoppinglist.css`](step-02/shoppinglist.css):

	```
	main #add-button {
	  position: fixed;
	  bottom: 25px;
	  right: 25px;
	}
	
	main .card {
	  margin: 30px;
	}
	
	.secondary-color {
	  background-color: #FF6CA1 !important;
	}
	
	.secondary-color * {
	  color: #000000 !important;
	}
	
	h5 {
	  font-weight: 300;
	}
	
	.btn-flat {
	  color: #7f91A9;
	}
	
	.btn-flat:hover {
	  background-color: rgba(0,0,0,0.1);
	}
	
	input:focus:not([disabled]):not([readonly]) {
	  border-bottom-color: #52647A !important;
	}
	
	body.shopping-list-add .list-bottom-sheet {
	  z-index: 1007;
	  display: block;
	  bottom: 0px;
	  opacity: 1;
		transition-property: bottom;
		transition-duration: .75s;
	}
	
	body.shopping-list-add .modal-overlay {
	  display: block;
	  opacity: 0.5;
		transition-property: all;
		transition-duration: 0.25s;
	  z-index: 1006; 
	}
	```

1. Add the code in [`shoppinglist.js`](step-02/shoppinglist.js) to open, save, and close the form and show the available lists:

	```js
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
	
	  window.shopper = shopper
	}())
	```

1. Update [`shoppinglists.model.js`](step-02/shoppinglist.model.js) to save and retrieve shoppings lists. The schema being used for the shopping list is defined in the [shopping-list-example](https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-example) documentation:

	```js
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
		
		    if (d.type === 'list') {
		      doc = initListDoc(d)
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
		
		  window.addEventListener('DOMContentLoaded', function () {
		    window.shopper(model)
		  })
		}())
	```

1. Refresh your web browser to view the updates made to the app. At this point, you should be able to create shopping lists and see the created shopping lists. Your code should be similar to [Tutorial - Step 2](step-02) and your app should should resemble:

    ![Step 2 screenshot](resources/step-02.png)

### Updating a Shopping List

Creating a shopping list is a good first step but better is to also be able to edit and delete the shopping list.

1. Edit the shopping list template in the [`index.html`](step-03/index.html) to include a form to edit the list and a button to remove the list:

	```html
    <!-- template: shopping list -->
    <script type="text/template" id="shopping-list-template">
      <div class="list-view collapsible">
        <div class="card-content">
          <span class="card-title activator">{{title}}
              <button class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
          </span>
        </div>
      </div>
      <div class="list-edit collapsible closed">
        <form id="form-{{_sanitizedid}}" class="col s12 white" onsubmit="shopper.update('{{_id}}', event); return false">
          <div class="card-content">
            <span class="card-title">
              <button id="close-{{_sanitizedid}}" type="button" class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">close</i></button>
            </span>
            <h5>Edit Shopping List</h5>
            <div class="row">
              <div class="input-field col s12">
                <input name="title" type="text" class="validate" value="{{title}}" placeholder="{{title}}" required />
              </div>
            </div>
          </div>
          <div class="card-action">
            <button class="btn-flat" type="button" onclick="shopper.remove('{{_id}}')">Remove</button>
            <button class="btn-flat" type="submit">Update</button>
          </div>
        </form>
      </div>
    </script>
	```

1. Append the edit form styles to [`shoppinglist.css`](step-03/shoppinglist.css)

	```css
	.collapsible {
	  overflow-y: hidden;
	  margin: 0;
		max-height: calc(100vh - 65px);
		transition-property: all;
		transition-duration: .55s;
	}
	
	.collapsible.closed {
		max-height: 0;
		transition-property: all;
		transition-duration: .15s;
	}
	
	.card.collapsible {
		transition-duration: 2s;
	}
	
	.list-edit .card-action {
	  border: 0 none;
	  padding: 0;
	  text-align: right;
	}
	
	.list-edit form {
	  margin: 15px;
	}
	```

1. In the [`shoppinglist.js`](step-03/shoppinglist.js), add the function to remove a shopping list:

	```js
	// remove from DOM node list
	var removeFromList = function (id) {
		var list = document.getElementById(sanitize(id))
		shopper.toggle(list)
		list.parentElement.removeChild(list)
	}
	```

1. For the [`shoppinglist.model.js`](step-03/shoppinglist.model.js), define the functions for removing a shopping list and getting a shopping list. And edit the save function to update a shopping list accordingly:

	```js
	model.save = function (d, callback) {
		var doc = null
		if (d._id) {
		  doc = d
		  doc['updatedAt'] = new Date().toISOString()
		} else if (d.type === 'list') {
		  doc = initListDoc(d)
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
	```

1. Refresh your web browser to view the these new updates to the app. You can now edit and remove your shopping lists! Your code should be similar to [Tutorial - Step 3](step-03) and your app should resemble:

    ![Step 3 screenshot](resources/step-03.png)

### Adding Items to a Shopping List

A shopping list is not complete without the means to add items to the list. Next, you should add the ability to add, edit, remove, check-off items in a shopping list.

1. Similar to the shopping list, the [`index.html`](step-04/index.html) should include the **Add an Item** form and the template for a shopping list item:

	```html
	<!doctype html>
	<html lang="en">
	...
	<body>
		<!-- banner -->
		<header class="navbar-fixed">
			...
				<span class="brand-logo left">
					<a href="#" onclick="shopper.goto(); return false" class="goback"><i class="material-icons">arrow_back</i></a>
					<span id="header-title">Shopping Lists</span>
				</span>
			...
		</header>
		<main>
			...
			<!-- modal: add a shopping list item form -->
			<div class="modal bottom-sheet item-bottom-sheet">
			  <form id="shopping-list-item-add" class="col s12 white" onsubmit="shopper.add(event); return false">
			    <div class="modal-content">
			      <h5>Add an Item</h5>
			      <div class="row">
			        <div class="input-field col s12">
			          <input name="title" type="text" class="validate" placeholder="Enter an item to add to the shopping list" required />
			        </div>
			        <input name="type" type="hidden" value="item">
			      </div>
			    </div>
			    <div class="modal-footer primary-color">
			      <button class="btn-flat" type="button" onclick="shopper.closeadd()">Cancel</button>
			      <button class="btn-flat" type="submit">Add</button>
			    </div>
			  </form>
			</div>
			    
			<!-- modal: overlay -->
			<div class="modal-overlay" onclick="shopper.closeadd()"></div>
			    
			<!-- template: shopping list -->
			<script type="text/template" id="shopping-list-template">
			  <div class="list-view collapsible">
			    <div class="card-content" onclick="shopper.goto('{{_id}}', '{{title}}', event)">
					<span class="card-title activator">{{title}}
						<button class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
					</span>
				</div>
				...
			</script>
			    
			<!-- template: shopping list item -->
			<script type="text/template" id="shopping-list-item-template">
			  <div class="item-view collapsible">
			    <input type="checkbox" id="checked-item-{{_sanitizedid}}" name="checked-item-{{_sanitizedid}}" {{_checked}} onclick="shopper.update('{{_id}}')" value="{{title}}" />
			    <label for="checked-item-{{_sanitizedid}}">{{title}}</label>
			    <button class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
			  </div>
			  <div class="item-edit collapsible closed">
			    <form id="form-{{_sanitizedid}}" class="col s12 tertiary lighter" onsubmit="shopper.update('{{_id}}', event); return false">
			      <div>
			        <span class="card-title">
			          <button id="close-{{_sanitizedid}}" type="button" class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">close</i></button>
			        </span>
			        <h5>Edit Item</h5>
			        <div class="row">
			          <div class="input-field col s12">
			            <input name="title" type="text" class="validate" value="{{title}}" placeholder="{{title}}" required />
			          </div>
			        </div>
			      </div>
			      <div class="card-action">
			        <button class="btn-flat" type="button" onclick="shopper.remove('{{_id}}')">Remove</button>
			        <button class="btn-flat" type="submit">Update</button>
			      </div>
			    </form>
			  </div>
			</script>
		...
		</body>
	</html>
	```

1. The [`shoppinglist.css`](step-04/shoppinglist.css) should be updated to include styles for the shopping list items and shopping list item form:

	```css
	...
	
	body.shopping-list-add .list-bottom-sheet,
	body.shopping-list-item-add .item-bottom-sheet {
	  z-index: 1007;
	  display: block;
	  bottom: 0px;
	  opacity: 1;
		transition-property: bottom;
		transition-duration: .75s;
	}
	
	body.shopping-list-add .modal-overlay,
	body.shopping-list-item-add .modal-overlay {
	  display: block;
	  opacity: 0.5;
		transition-property: all;
		transition-duration: 0.25s;
	  z-index: 1006; 
	}
	
	...
	
	.list-edit .card-action,
	.item-edit .card-action {
	  border: 0 none;
	  padding: 0;
	  text-align: right;
	}
	
	.item-edit form,
	.list-edit form {
	  margin: 15px;
	}
	
	#shopping-list-items .card,
	#shopping-list-items .card .collapsible {
	  border: 0 none;
	  box-shadow: initial;
	}
	
	#shopping-list-items .collection-item {
	  border-bottom: 1px solid #DDDDDD;
	  padding: 30px;
	  margin: 0 35px;
	}
	
	#shopping-list-items .card label {
	  font-size: 20px;
	  font-weight: 300;
	  line-height: initial;
	}
	
	.collection-item input:checked ~ label {
	  text-decoration: line-through;
	}
	
	.collection-item input:checked ~ button {
	  visibility: hidden;
	}
	
	.collection-item input:not(:checked) ~ label {
	  color: #212121;
	}
	
	body[data-list-id] {
	  background-color: #FFFFFF !important;
	}
	
	body[data-list-id] #shopping-lists,
	body[data-list-id] #shopping-list-items {
	  transform: translate(-100vw);
	}
	
	.goback {
	  visibility: hidden;
	}
	
	body[data-list-id] .goback {
	  visibility: initial;
	}
	```

1. The add and update functions in the [`shoppinglist.js`](step-04/shoppinglist.js) need to updated to account for adding/updating of shopping list items. In addition, a `goto` function should be created to handle navigating between shopping lists and shopping list items:

	```js
	(function () {
	  'use strict'
	  
	  ...
	  
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
	    }
	  }
	  
	  ...
	  
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
	  
	  ...
	  
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
	  
	  ...
	  
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
	
	  window.shopper = shopper
	}())
	```

1. Update the [`shoppinglist.model.js`](step-04/shoppinglist.model.js) functions to properly handle the saving, retrieving, and updating of shopping list items. The schema being used for the shopping list item is defined in the [shopping-list-example](https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-example) documentation:
	
	```js
	(function () {
	  'use strict'
	
	  // PouchDB
	  var db = null
	
	  // Shopping List Schema
	  // https://github.com/ibm-watson-data-lab/shopping-list#shopping-list-example
	  var initListDoc = function (doc) {
	    ...
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
	  
	  ...
	  
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
	  
	  ...
	  
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
	```

1. Refresh your web browser to view the latest version of the app. You should be able to add, edit, remove, and check off shopping list items for your shopping lists. Your code should be similar to [Tutorial - Step 4](step-04) and your app should resemble:

    ![Step 4 screenshot](resources/step-04.png)

### Updating Shopping List Items Count

A much needed functionality to make the app feel closer to completion and improve user expereince is to be able to see the number of (checked and total) items in a shopping list without having to go into the shopping list. You should now add an items count to be shown for each shopping list:

1. In the [`index.html`](step-05/index.html), the shopping list template should be updated to include a `div` for the item count info:

	```html
	<!-- template: shopping list -->
	<script type="text/template" id="shopping-list-template">
	  <div class="list-view collapsible">
	    <div class="card-content" onclick="shopper.goto('{{_id}}', '{{title}}', event)">
	      <span class="card-title activator">{{title}}
	          <button class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">more_vert</i></button>
	      </span>
	    </div>
	    <div class="card-action">
	      <input type="checkbox" id="checked-list-{{_sanitizedid}}" name="checked-list-{{_sanitizedid}}" {{_checked}} disabled />
	      <label for="checked-list-{{_sanitizedid}}">0 items</label>
	    </div>
	  </div>
	  <div class="list-edit collapsible closed">
	    <form id="form-{{_sanitizedid}}" class="col s12 white" onsubmit="shopper.update('{{_id}}', event); return false">
	      <div class="card-content">
	        <span class="card-title">
	          <button id="close-{{_sanitizedid}}" type="button" class="btn-flat more-btn right" onclick="shopper.toggle('{{_sanitizedid}}', event)"><i class="material-icons">close</i></button>
	        </span>
	        <h5>Edit Shopping List</h5>
	        <div class="row">
	          <div class="input-field col s12">
	            <input name="title" type="text" class="validate" value="{{title}}" placeholder="{{title}}" required />
	          </div>
	        </div>
	      </div>
	      <div class="card-action">
	        <button class="btn-flat" type="button" onclick="shopper.remove('{{_id}}')">Remove</button>
	        <button class="btn-flat" type="submit">Update</button>
	      </div>
	    </form>
	  </div>
	</script>
	``` 

1. Style for the item count should be appended to the [`shoppinglist.css`](step-05/shoppinglist.css):

	```css
	[type="checkbox"]:disabled:not(:checked) + label::before {
	  display: none;
	}
	```

1. A function to compute the item counts needs to added to [`shoppinglist.js`](step-05/shoppinglist.js) and the add and remove functions updated accordingly:

	```js
	// add docs to DOM node list
	var addToList = function (docs, clear) {
	
		...
		
		for (var i = 0; i < docs.length; i++) {
		
			...
			
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
	```

1. Refresh your web browser to view the app. Shopping lists should now display with an items count which should update when items gets add, removed, or checked. Your code should be similar to [Tutorial - Step 5](step-05) and your app should resemble:

    ![Step 5 screenshot](resources/step-05.png)


## The PouchDB Database

The shopping list app just created is using PouchDB, an in-browser database, for its data store. PouchDB allows your application state to be retained between site visits without needing to send any data to a server-side process.

If you exit your browser and return you will notice the state of your shopping list data remains in tact.

Furthermore, PouchDB can sync with a remote Apache CouchDB or IBM Cloudant service and keep your local data in sync with the remote service. More on this later.


## Making a PWA

At this stage, you have a full functioning shopping list web application. However, it is not very helpful if you lose connectivity or have spotty internet connection.

Try it! Turn off your web server, refresh your web browser, and try to use your application. Exit your browser and try to go back to your app. Your shopping list app is not very usable.

To remedy this you want to turn your application into a Progressive Web App (PWA). A PWA is web application that can be _installed_ on a mobile device with an icon on the home screen, just like a native mobile app. But more importantly, the application is still functional when internet connection is lost. To achieve this you will need to add a few additional components (i.e., service worker, manifest.json, and icons).

#### Reviewing your PWA score

If you are using the Chrome browser you can audit your application and get a PWA score and tips on improving the user experience of your app. While viewing your shopping list web application in the Chrome browser:

1. Open the Developer Tools
1. Click on **Audit**
1. Click on **Perform an audit...**
1. Select all check boxes
1. Click **Run audit**
1. Once the audit completes you should see a score along with info on how to improve the score:

	![Step 5 PWA score screenshot](resources/step-05-pwa.png)
 

#### Register a Service Worker

A Service Worker is a JavaScript process dedicated to your app. It can intercept all web traffic initiated by your app allowing you the ability to cache assets as required for offline access. The cache strategy to use depends on the requirements of your application and the experience you want to provide. For this shopping list application, you will try to fulfill request first by going to the network and if that fails, fallback to using what is in the cache.

1. Create a [`worker.js`](step-06/worker.js) (at the root of your application) with the below code. When the service worker is installed (`self.addEventListener('install' ... )`) it should cache all relevant assets. When requesting an asset make a network request first, it network request fails retrieves from cache:

	```js
	var CACHE_NAME = 'v1'
	
	var urlstocache = [
	  '/',
	  'index.html',
	  'https://fonts.googleapis.com/icon?family=Material+Icons',
	  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700',
	  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css',
	  'https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.min.js',
	  'https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.find.min.js',
	  'shoppinglist.css',
	  'shoppinglist.js',
	  'shoppinglist.model.js'
	]
	
	var fromnetwork = function (request, cache) {
	  return fetch(request).then(function (response) {
	    if (request.url.indexOf('https://fonts.gstatic.com') === 0) {
	      // cache fonts
	      if (response.status < 400) {
	        cache.put(request, response.clone())
	      }
	    }
	    return response
	  })
	}
	
	// install/cache page assets
	self.addEventListener('install', function (event) {
	  event.waitUntil(
	    caches.open(CACHE_NAME)
	      .then(function (cache) {
	        console.log('cache opened')
	        return cache.addAll(urlstocache)
	      })
	  )
	})
	
	// intercept page requests
	self.addEventListener('fetch', function (event) {
	  console.log('fetch', event.request.url)
	  event.respondWith(
	    caches
	      .open(CACHE_NAME)
	      .then(function (cache) {
	        // try from network first
	        return fromnetwork(event.request, cache)
	          .catch(function () {
	            // network failed retrieve from cache
	            return cache.match(event.request)
	          })
	      })
	  )
	})
	
	// service worker activated, remove outdated cache
	self.addEventListener('activate', function (event) {
	  console.log('worker activated')
	  event.waitUntil(
	    caches.keys().then(function (keys) {
	      return Promise.all(
	        keys.filter(function (key) {
	          // filter old versioned keys
	          return key !== CACHE_NAME
	        }).map(function (key) {
	          return caches.delete(key)
	        })
	      )
	    })
	  )
	})
	```

1. Update the [`index.html`](step-06/index.html) to register the service worker:
	
	```html
	<!doctype html>
	<html lang="en">
	
	...
	
	    <!-- service worker -->
	    <script>
	      if ('serviceWorker' in navigator) {
	        window.addEventListener('load', function() {
	          // register service worker
	          navigator.serviceWorker.register('worker.js').then(function(registration) {
	            console.log('ServiceWorker registration successful with scope: ', registration.scope)
	          }, function(err) {
	            console.log('ServiceWorker registration failed: ', err)
	          })
	        })
	      }
	    </script>
	  </body>
	</html>
	```

1. Refresh your web browser to view the latest version of the app. The Service Worker should have been installed. Turn off your web server and then refresh your web browser. Your shopping list app should still be functional. Your code should be similar to [Tutorial - Step 6](step-06) and reviewing your PWA score it should be slightly improved:

	![Step 6 PWA score screenshot](resources/step-06-pwa.png)


#### Using a `manifest.json`

The manifest file contains your PWA's meta data. It identifies the app name, icon urls, and color information to be used when _installing_ the app on a mobile device. Depending on the device being targetted multiple icons will be needed and different meta data should be provided:

1. Add the necessary app icons into a directory (e.g., `favicons`) in your app. See [favicons](step-07/favicons)
1. Create a [`manifest.json`](step-07/manifest.json) at the root of your app and fill it out with the appropriate info.

	```json
	{  
	  "short_name": "Shopper",
	  "name": "Shopping List",
	  "start_url": "/",
	  "background_color": "#283b4f",
	  "theme_color": "#283b4f",
	  "display": "standalone",
	  "orientation": "portrait", 
	  "icons": [
	    {
	      "src": "favicons/android-chrome-192x192.png",  
	      "sizes": "192x192",  
	      "type": "image/png"  
	    },
	    {  
	      "src": "favicons/android-chrome-512x512.png",  
	      "sizes": "512x512",  
	      "type": "image/png"  
	    }
	  ]
	}
	```

1. For Windows mobile devices, create a [`browserconfig.xml`](step-07/browserconfig.xml) file at the root of your app:

	```xml
	<?xml version="1.0" encoding="utf-8"?>
	<browserconfig>
	    <msapplication>
	        <tile>
	            <square150x150logo src="favicons/mstile-150x150.png"/>
	            <TileColor>#283b4f</TileColor>
	        </tile>
	    </msapplication>
	</browserconfig>
	```

1. Update the [`index.html`](step-07/index.html) header to include the appropriate meta data:

	```html
	<!doctype html>
	<html lang="en">
	  <head>
	  
	  	...
	  	
	    <meta name="theme-color" content="#283b4f">
	    <meta name="mobile-web-app-capable" content="yes">
	    <meta name="apple-mobile-web-app-capable" content="yes">
	    <meta name="apple-mobile-web-app-status-bar-style" content="#283b4f">
	    <meta name="apple-mobile-web-app-title" content="Shopping List">
	
	    <meta name="msapplication-config" content="browserconfig.xml">
	
	    <link rel="apple-touch-icon" sizes="180x180" href="favicons/apple-touch-icon.png">
	    <link rel="icon" type="image/png" sizes="32x32" href="favicons/favicon-32x32.png">
	    <link rel="icon" type="image/png" sizes="16x16" href="favicons/favicon-16x16.png">
	    <link rel="mask-icon" href="favicons/safari-pinned-tab.svg" color="#283b4f">
	    <link rel="shortcut icon" href="favicons/favicon.ico">
	
	    <link rel="manifest" href="manifest.json">
	    
	    ...
	    
	  </head>
	  ...
	</html>
	```

1. Update the URLs to cache in the [`worker.js`](step-07/worker.js) to include the new assets:

	```js
	var urlstocache = [
	  '/',
	  'index.html',
	  'favicons/android-chrome-192x192.png',
	  'favicons/android-chrome-512x512.png',
	  'favicons/apple-touch-icon.png',
	  'favicons/favicon-16x16.png',
	  'favicons/favicon-32x32.png',
	  'favicons/favicon.ico',
	  'favicons/mstile-150x150.png',
	  'favicons/safari-pinned-tab.svg',
	  'https://fonts.googleapis.com/icon?family=Material+Icons',
	  'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700',
	  'https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css',
	  'https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.min.js',
	  'https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.find.min.js',
	  'shoppinglist.css',
	  'shoppinglist.js',
	  'shoppinglist.model.js'
	]
	```

1. Refresh your web browser to view your updated shopping list web application. The manifest file and icons should now be recognized by the browser. Your code should be similar to [Tutorial - Step 7](step-07) and reviewing your PWA score it should be much improved:

	![Step 7 PWA score screenshot](resources/step-07-pwa.png)

That's it! You have yourself a progessive web app. Your app can be _installed_ on mobile devices and can continue to function when internet connection is unavailable or unreliable.

## Syncing Data

Your shopping list app is now a PWA, but it is not yet fully complete. Currently, if you access your app from different devices or browsers, each instance will have its own set of data. Not an ideal situation if you want to share or access your shopping lists across browsers and devices.

With PouchDB, it is very simple to sync your in-browser database to a remote database for backup or data-sharing purposes. In the above scenario, if the app in each device is configured to the same remote database, you can then have access to same shopping list no matter where or how you access it.

1. Add a settings button and form to the [`index.html`](step-08/index.html):

	```html
	<!doctype html>
	<html lang="en">
		...
		<body>
			<!-- banner -->
			<header class="navbar-fixed">
			...
						<!-- settings button -->
						<a href="#" onclick="shopper.opensettings(); return false" class="right settings"><i class="material-icons">settings</i></a>
					</div>
				</nav>
			</header>
			...
	    
			<!-- modal: add a shopping list settings form -->
			<div class="modal top-sheet settings-top-sheet">
				<form id="shopping-list-settings" class="col s12 white" onsubmit="shopper.settings(event); return false">
					<div class="modal-content">
						<h5>Shopping Lists Settings</h5>
						<div class="row">
							<div class="input-field col s12">
								<span class="primary-text darker">Enter a fully qualified URL (including username and password) to a remote IBM Cloudant, Apache CouchDB, or PouchDB database to sync your shopping list.</span>
								<input name="remoteDB" type="url" class="validate" placeholder="http://username:password@localhost:5984/database" />
								<div class="chip"></div>
							</div>
						</div>
					</div>
					<div class="modal-footer secondary-color">
						<button class="btn-flat" type="button" onclick="shopper.closesettings()">Cancel</button>
						<button class="btn-flat" type="submit">Sync</button>
					</div>
				</form>
			</div>
	    
			<!-- modal: overlay -->
			<div class="modal-overlay" onclick="shopper.closeadd()"></div>
		...
		</body>
	</html>
	```

1. Add the styles for the settings form and syncing indicator in the [`shoppinglist.css`](step-08/shoppinglist.css):

	```css
	...
	
	body.shopping-list-add .modal-overlay,
	body.shopping-list-item-add .modal-overlay,
	body.shopping-list-settings .modal-overlay {
	  display: block;
	  opacity: 0.5;
		transition-property: all;
		transition-duration: 0.25s;
	  z-index: 1006; 
	}
	
	...
	
	.modal.top-sheet {
	  bottom: auto;
	  top: -100%;
	  margin: 0;
	  width: 100%;
	  border-radius: 0;
	  will-change: bottom, opacity;
	}
	
	body.shopping-list-settings .settings-top-sheet {
	  z-index: 1007;
	  display: block;
	  top: 0px;
	  opacity: 1;
	  transition-property: top;
	  transition-duration: .75s;
	}
	
	.settings {
	  margin-right: 25px;
	}
	
	#shopping-list-settings .input-field {
	  margin-top: 2.2rem;
	}
	
	#shopping-list-settings label {
	  font-size: 1.2rem;
	  top: -20px;
	}
	
	#shopping-list-settings .chip {
	  display: none;
	  font-weight: 300;
	}
	
	.shopping-list-error-sync #shopping-list-settings .chip {
	  display: inline-block;
	  background-color: #C83873;
	  color: #FFFFFF;
	}
	
	.shopping-list-error-sync #shopping-list-settings .chip::after {
	  content: 'Sync Error';
	}
	
	.shopping-list-sync #shopping-list-settings .chip {
	  display: inline-block;
	  background-color: #273A4E;
	  color: #FFFFFF;
	}
	
	.shopping-list-sync #shopping-list-settings .chip::after {
	  content: 'Syncing';
	}
	
	.shopping-list-sync nav a.settings > i {
	  display: inline-block;
	  animation-name: spinanimation;
	  animation-duration: 0.7s;
	  animation-timing-function: linear;
	  animation-iteration-count: infinite;
	}
	
	@-webkit-keyframes spinanimation {
	  from { -webkit-transform: rotate(0deg) }
	  to { -webkit-transform: rotate(360deg) }
	}
	@-moz-keyframes spinanimation {
	  from { -moz-transform: rotate(0deg) }
	  to { -moz-transform: rotate(360deg) }
	}
	@-ms-keyframes spinanimation {
	  from { -ms-transform: rotate(0deg) }
	  to { -ms-transform:rotate(360deg) }
	}
	@keyframes spinanimation {
	  from { transform: rotate(0deg) }
	  to { transform: rotate(360deg) }
	}
	```

1. In [`shoppinglist.js`](step-08/shoppinglist.css), define the settings and syncing functions and also, update the shopper function to check the settings and sync with remote database:

	```js
	(function () {
		'use strict'
		
		...
		
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
		
		...
		
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
	```

1. Adding the settings and syncing functions to the [`shoppinglist.model.js`](step-08/shoppinglist.model.js):

	```js
	(function () {
		'user strict'
		
		...
		
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
						if (typeof cb === 'function') {
							cb(err, response)
						}
					})
				})
			} else {
				db.get(id, function (err, doc) {
					if (typeof cb === 'function') {
						cb(err, doc)
					}
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
						if (typeof oncomplete === 'function') {
							oncomplete(null, info)
						}
			
						// then two-way, continuous, retriable sync
						dbsync = db.sync(remoteDB, { live: true, retry: true })
							.on('change', function (info) {
								// incoming changes only
								if (info.direction === 'pull' && info.change && info.change.docs) {
									if (typeof onchange === 'function') {
										onchange(null, info.change.docs)
									}
								}
							})
							.on('error', function (err) {
								if (typeof onchange === 'function') {
									onchange(err, null)
								}
							})
					})
					.on('error', function (err) {
						if (typeof oncomplete === 'function') {
							oncomplete(err, null)
						}
					})
			} else if (typeof oncomplete === 'function') {
				oncomplete()
			}
		}
		
		window.addEventListener('DOMContentLoaded', function () {
			window.shopper(model)
		})
	}())
	```

1. Refresh your web browser to view the completed app. The app should now have a settings button you can click to go to the settings form and configure the URL to the remote database. Your completed code should be similar to [Tutorial - Step 8](step-08) and your app should resemble:

	![Step 8 screenshot](resources/step-08.png)


### Remote Databases

PouchDB can sync with a remote Apache CouchDB, IBM Cloudant, or PouchDB database. In the settings form, enter the URL of a remote CouchDB, Cloudant or PouchDB database. For example:

`https://user:pass@host.cloudant.com/shopping`

and click the **Sync** button.

## Summary

In this tutorial, you have created a shopping list web app using vanilla JavaScript, HTML, and CSS. It stores its data in an in-browser database. It can be used offline and it can also be installed on mobile devices.

The final version of the code can be found [here](https://github.com/ibm-watson-data-lab/shopping-list-vanillajs-pouchdb). This version adds some extra features not included in the tutorial:

* Shopping lists are sorted on load by most recently updated
* Shopping list items are sorted on load by title
* Application (banner and add button) color changes if offline is detected (where supported)
* Show error icon in the banner when sync fails
* Keyboard navigation
* Use [cuid](https://usecuid.org/) for IDs


## Resources

* [Offline First](http://offlinefirst.org/)
* [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/)
* [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
* [Web App Manifest](https://w3c.github.io/manifest/)
* [PouchDB](https://pouchdb.com/)
* [Apache CouchDB](https://couchdb.apache.org/)
* [IBM Cloudant](https://cloudant.com/)
* [Vanilla JS](http://vanilla-js.com/)
* [Materialize CSS](http://materializecss.com/getting-started.html)

