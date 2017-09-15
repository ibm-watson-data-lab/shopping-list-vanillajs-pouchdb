/* global self, caches, fetch */
'use strict'

var cachename = 'shopping-list-vanillajs-pouchdb-0.0.5'
var urlstocache = [
  '/shopping-list-vanillajs-pouchdb/',
  '/shopping-list-vanillajs-pouchdb/index.html',
  '/shopping-list-vanillajs-pouchdb/fonts/materialicons/MaterialIcons-Regular.ttf',
  '/shopping-list-vanillajs-pouchdb/fonts/materialicons/MaterialIcons-Regular.woff',
  '/shopping-list-vanillajs-pouchdb/fonts/materialicons/MaterialIcons-Regular.woff2',
  '/shopping-list-vanillajs-pouchdb/fonts/materialicons/MaterialIcons-Regular.eot',
  '/shopping-list-vanillajs-pouchdb/css/materialize.min.css',
  '/shopping-list-vanillajs-pouchdb/css/shoppinglist.css',
  '/shopping-list-vanillajs-pouchdb/favicons/android-chrome-192x192.png',
  '/shopping-list-vanillajs-pouchdb/favicons/android-chrome-512x512.png',
  '/shopping-list-vanillajs-pouchdb/favicons/apple-touch-icon.png',
  '/shopping-list-vanillajs-pouchdb/favicons/favicon-16x16.png',
  '/shopping-list-vanillajs-pouchdb/favicons/favicon-32x32.png',
  '/shopping-list-vanillajs-pouchdb/favicons/favicon.ico',
  '/shopping-list-vanillajs-pouchdb/favicons/mstile-150x150.png',
  '/shopping-list-vanillajs-pouchdb/favicons/safari-pinned-tab.svg',
  '/shopping-list-vanillajs-pouchdb/js/browser-cuid.min.js',
  '/shopping-list-vanillajs-pouchdb/js/pouchdb-6.3.4.min.js',
  '/shopping-list-vanillajs-pouchdb/js/pouchdb.find.js',
  '/shopping-list-vanillajs-pouchdb/js/shoppinglist.js',
  '/shopping-list-vanillajs-pouchdb/js/shoppinglist.model.js'
]

// install/cache page assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(cachename)
      .then(function (cache) {
        console.log('cache opened')
        return cache.addAll(urlstocache)
      })
  )
})

// intercept page requests
self.addEventListener('fetch', function (event) {
  console.log(event.request.url)
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // serve requests from cache (if found)
      return response || fetch(event.request)
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
          return key !== cachename
        }).map(function (key) {
          return caches.delete(key)
        })
      )
    })
  )
})
