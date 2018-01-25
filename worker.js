/* global self, caches, fetch */
'use strict'

// cache name
// when changed invalidates previous caches
var CACHE_NAME = 'shopping-list-vanillajs-pouchdb-0.0.5'

// assets to be cached
var urlstocache = [
  '/shopping-list-vanillajs-pouchdb',
  '/shopping-list-vanillajs-pouchdb/',
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

/**
 * Makes a network call for the request (and caches any fonts.gstatic.com requests)
 *
 * @param  {Object} request
 * @param  {Object} cache
 *         Store fonts.gstatic.com responses
 * @return {Object}
 *         The response from the network request
 */
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

// service worker installed
// cache page assets
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
// looks for  response in the cache before attempting network call
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

// service worker activated
// remove outdated cache
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
