/* global self, caches, fetch */
'use strict'

var cachename = 'shopping-list-vanillajs-pouchdb-0.0.3'
var urlstocache = [
  '/shopping-list-vanillajs-pouchdb',
  '/shopping-list-vanillajs-pouchdb/index.html',
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
  'https://cdnjs.cloudflare.com/ajax/libs/cuid/1.3.8/browser-cuid.min.js',
  'https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.min.js',
  'https://cdn.jsdelivr.net/npm/pouchdb@6.3.4/dist/pouchdb.find.min.js',
  'css/shoppinglist.css',
  'js/shoppinglist.js',
  'js/shoppinglist.model.js'
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
  // respond with cached response. if not found, fetch then add to cache
  event.respondWith(
    caches.open(cachename).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function (response) {
          cache.put(event.request, response.clone())
          return response
        })
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
          return key !== cachename
        }).map(function (key) {
          return caches.delete(key)
        })
      )
    })
  )
})
