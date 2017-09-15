/* global self, caches, fetch */
'use strict'

var cachename = 'shopping-list-vanillajs-pouchdb-0.0.2'
var urlstocache = [
  '/',
  '/index.html',
  '/iconfont/MaterialIcons-Regular.ttf',
  '/iconfont/MaterialIcons-Regular.woff',
  '/iconfont/MaterialIcons-Regular.woff2',
  '/iconfont/MaterialIcons-Regular.eot',
  '/css/materialize.min.css',
  '/css/shoppinglist.css',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png',
  '/favicons/apple-touch-icon.png',
  '/favicons/favicon-16x16.png',
  '/favicons/favicon-32x32.png',
  '/favicons/favicon.ico',
  '/favicons/mstile-150x150.png',
  '/favicons/safari-pinned-tab.svg',
  '/js/browser-cuid.min.js',
  '/js/pouchdb-6.3.4.min.js',
  '/js/pouchdb.find.js',
  '/js/shoppinglist.js',
  '/js/shoppinglist.model.js'
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
