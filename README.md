# Create an Offline First Shopping List with vanilla JavaScript and PouchDB 

In this code pattern, we will create an Offline First shopping list. Shopping List is an Offline First demo Progressive Web App built using vanilla JavaScript and [PouchDB](https://pouchdb.com/). [This app is part of a series of Offline First demo apps, each built using a different stack.](https://github.com/ibm-watson-data-lab/shopping-list) 

When the reader has completed this Code Pattern, they will understand how to:

- create a shopping list web application that stores its data in a local PouchDB database.
- turn the web application into a Progressive Web App that works with or without an internet connection.
- make the app sync to and from a remote Cloudant database.

![architecture](doc/source/images/architecture.png)

## Flow

1. Browser loads Progressive Web App's resources from the web server
2. User interacts with the web app to add shopping lists and list items
3. Data is stored locally in PouchDB
4. PouchDB syncs its data with a remote IBM Cloudant database

## Included components

* [Cloudant NoSQL DB](https://console.ng.bluemix.net/catalog/services/cloudant-nosql-db): A fully managed data layer designed for modern web and mobile applications that leverages a flexible JSON schema.

## Featured technologies

* [PouchDB](https://pouchdb.com/) - an in-browser database that can replicate to and from a remote Apache CouchDB or IBM Cloudant database.
* [JavaScript](https://developer.mozilla.org/bm/docs/Web/JavaScript) - this demo uses no frameworks, just plain vanilla JavaScript.
* [Databases](https://en.wikipedia.org/wiki/IBM_Information_Management_System#.22Full_Function.22_databases): Repository for storing and managing collections of data.

# Steps

* [Deploy to IBM Cloud](#deploy-to-ibm-cloud) **OR** [Run locally](#run-locally)
* [Database and replication setup](#database-and-replication-setup)

## Deploy to IBM Cloud
[![Deploy to IBM Cloud](https://metrics-tracker.mybluemix.net/stats/5c5df69e10058d49cdc1f4d2fc63ce31/button.svg)](https://bluemix.net/deploy?repository=https://github.com/ibm-watson-data-lab/shopping-list-vanillajs-pouchdb)

1. Press the above ``Deploy to IBM Cloud`` button and then click on ``Deploy``.

1. In Toolchains, click on Delivery Pipeline to watch while the app is deployed. Once deployed, the app can be viewed by clicking `View app`.

1. To see the app and services created and configured for this code pattern, use the IBM Cloud dashboard. The app is named `shopping-list-vanillajs-pouchdb` with a unique suffix. The following services are created and easily identified by the `sljsp-` prefix:
    * sljsp-CloudantNoSQLDB

## Run locally

1. [Clone the repo](#1-clone-the-repo)
1. [Run the server](#2-run-the-server)
1. [Create a Cloudant or CouchDB service](#3-create-a-cloudant-or-couchdb-service)

### 1. Clone the repo

Clone the `shopping-list-vanillajs-pouchdb` locally. In a terminal, run:

```
$ git clone https://github.com/ibm-watson-data-lab/shopping-list-vanillajs-pouchdb
```

### 2. Run the Server

Assuming you have pre-installed [Node.js](https://nodejs.org/en/download/) and [npm](https://docs.npmjs.com/getting-started/installing-node), run the following commands:

    cd shopping-list-vanillajs-pouchdb
    npm install
    npm start

### 3. Create a Cloudant or CouchDB service

PouchDB can synchronize with CouchDB and compatible servers. To run and test locally, you can install CouchDB. Alternatively, you can use a hosted Cloudant NoSQL DB service for your remote DB.

#### Installing Apache CouchDB

[Install CouchDB 2.1](http://docs.couchdb.org/en/2.1.0/install/index.html). Instructions are available for installing CouchDB 2.1 on Unix-like systems, on Windows, on Mac OS X, on FreeBSD, and via other methods.

Configure CouchDB for a [single-node setup](http://docs.couchdb.org/en/2.1.0/install/setup.html#single-node-setup), as opposed to a cluster setup. Once you have finished setting up CouchDB, you should be able to access CouchDB at `http://127.0.0.1:5984/`. Ensure that CouchDB is running and take note of your admin username and password.

#### Creating a Cloudant NoSQL DB service

Sign up for an [IBM Cloud](https://console.ng.bluemix.net/) account, if you do not already have one.

Once you are logged in to IBM Cloud, create a new Cloudant instance on the [Cloudant NoSQL DB Bluemix Catalog](https://console.ng.bluemix.net/catalog/services/cloudant-nosql-db) page. This should take you to a page representing the newly-created service instance. Click the "Service credentials" link. You should have one set of service credentials listed. Click "View credentials" which should show you a JSON object containing your service credentials. Copy the value for the `url` key to your clipboard (the value will be in the form of `https://username:password@uniqueid-bluemix.cloudant.com`).

## Database and replication setup
1. [Create the remote database](#1-create-the-remote-database)
1. [Enable CORS](#2-enable-cors)
1. [Set the replication target](#3-set-the-replication-target)

### 1. Create the remote database

Use your Cloudant or CouchDB dashboard to create a database. Select the Databases icon on the left and then use the `Create Database` button to create the "shopping-list" database.
The Shopping List app can be used locally before the database exists, but cannot sync
until the remote database is completed.

![](doc/source/images/create_db.png)

### 2. Enable CORS

Cross-Origin Resource Sharing (CORS) needs to be enabled. Use your Cloudant or CouchDB dashboard to enable it. The CORS options are under the account settings or config depending on your version. Enable CORS and restrict the domain as needed for security.

![](doc/source/images/enable_cors.png)

### 3. Set the replication target

Run the Shopping List app and use the *Settings* form to enter your Database URL.
If you use the Bluemix Cloudant URL taken from the service credentials as described above, the URL includes user and password GUIDs.

Add `/shopping-list` to the URL to connect to the database that you created.

![](doc/source/images/replicator.png)

# Using the app

The app allows you to create a shopping list by clicking on the plus sign. Click on the list to see its items. Then, you can add items to the list by clicking the plus sign. There is a checkbox to allow you to mark the items complete as you buy load up your cart.

When you have not configured your Replication Target or when you are offline, the lists will not sync. One good way to test this is to run two browsers. You can use Chrome and Firefox and have different lists in each.

When you go online and have the database and CORS enabled and the Replication Target is set, the shopping lists will sync. You will then be able to use both lists from either browser.

![](doc/source/images/shopping_lists1.png)

![](doc/source/images/shopping_lists2.png)

## Running the app

## Running the tests

This project does not, at present, have any automated tests. If you'd like to contribute some then please raise and issue and submit a pull-request - we'd be very happy to add them! Any pull-request you contribute will run through our continuous integration process which will check your code style.

## Coding style

This repository's JavaScript code is built to the [JavaScript Standard Style](https://standardjs.com/). Our continuous integration will check your code against these standards when you push to GitHub. To test your code on your machine, simply run `npm test`.

## Deploying to GitHub Pages

# Privacy Notice

Refer to https://github.com/IBM/metrics-collector-service#privacy-notice.

## Disabling Deployment Tracking

To disable tracking, simply remove ``require('metrics-tracker-client').track();`` from the ``app.js`` file in the top level directory.


# Tutorial

Refer to the [tutorial](https://github.com/ibm-watson-data-lab/shopping-list-vanillajs-pouchdb/tree/master/tutorial) for step-by-step instructions on how to build your own Offline First shopping list Progressive Web App with Vanilla JS (aka plain old JavaScript) and PouchDB.

<!--Include any relevant links-->

# Links
* [Tutorial](https://github.com/ibm-watson-data-lab/shopping-list-vanillajs-pouchdb/tree/master/tutorial)
* [More Shopping List Sample Apps](https://github.com/ibm-watson-data-lab/shopping-list)
* [Offline First](http://offlinefirst.org/)
* [Progressive Web Apps](https://developers.google.com/web/progressive-web-apps/)
* [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
* [Web App Manifest](https://w3c.github.io/manifest/)
* [PouchDB](https://pouchdb.com/)
* [Apache CouchDB](https://couchdb.apache.org/)
* [IBM Cloudant](https://cloudant.com/)
* [Vanilla JS](http://vanilla-js.com/)  😂 &nbsp; (aka plain old [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript))
* [Materialize CSS](http://materializecss.com/getting-started.html)

<!--keep this-->

# License
[Apache 2.0](LICENSE)