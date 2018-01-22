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

* [Run locally](#run-locally)
* [Database and replication setup](#database-and-replication-setup)

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

Assuming you have pre-installed [Python](https://www.python.org/), simple run a simple web server:

    cd shopping-list-vanillajs-pouchdb
    python -m SimpleHTTPServer 8000

### 3. Create a Cloudant or CouchDB service

PouchDB can synchronize with CouchDB and compatible servers. To run and test locally, you can install CouchDB. Alternatively, you can use a hosted Cloudant NoSQL DB service for your remote DB.

#### Installing Apache CouchDB

[Install CouchDB 2.1](http://docs.couchdb.org/en/2.1.0/install/index.html). Instructions are available for installing CouchDB 2.1 on Unix-like systems, on Windows, on Mac OS X, on FreeBSD, and via other methods.

Configure CouchDB for a [single-node setup](http://docs.couchdb.org/en/2.1.0/install/setup.html#single-node-setup), as opposed to a cluster setup. Once you have finished setting up CouchDB, you should be able to access CouchDB at `http://127.0.0.1:5984/`. Ensure that CouchDB is running and take note of your admin username and password.

#### Creating a Cloudant NoSQL DB service

* Log in to [IBM Cloud](https://console.ng.bluemix.net/).
 > Sign up for an account, if you do not already have one.
* [Provision a Cloudant NoSQL DB _Lite_ plan instance](https://console.bluemix.net/catalog/services/cloudant-nosql-db), which is free.
  > If desired, you can also re-use an existing Cloudant NoSQL DB service instance. (Open the [**Data & Analytics**  resources dashboard](https://console.bluemix.net/dashboard/data) to see a list of pre-provisioned instances that you have access to.) 
 * Open the **Service credentials** tab.
* Add new credentials for this service instance if no credentials have been defined yet.
* View the credentials and note the value of the **url** property, which has the following format: `https://username:password@username-bluemix.cloudant.com`.

> Tip: Select the **Manage** tab and click **Launch** to open the Cloudant dashboard.
 
## Database and replication setup
1. [Create the remote database](#1-create-the-remote-database)
1. [Enable CORS](#2-enable-cors)
1. [Set the replication target](#3-set-the-replication-target)

### 1. Create the remote database

* Use the Cloudant or CouchDB dashboard to create a database.

* Select the Databases tab on the left and then use the `Create Database` button to create the "shopping-list" database.
The Shopping List app can be used locally before the database exists, but cannot sync
until the remote database is completed.

![](doc/source/images/create_db.png)

### 2. Enable CORS

* Open the Cloudant or CouchDB dashboard to enable Cross-Origin Resource Sharing (CORS).  

* Select the Account Settings (or config) tab and open the **CORS** tab.

* Enable CORS and restrict the domain as needed for security.

![](doc/source/images/enable_cors.png)

### 3. Set the replication target

Run the Shopping List app and use the *Settings* form to enter your database URL.
If you use the IBM Cloud Cloudant URL taken from the service credentials as described above, the URL includes user and password GUIDs.

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

<!--Include any relevant links-->

# Links
* [Demo on Youtube](https://www.youtube.com/watch?v=Jxi7U7VOMYg)
* [Watson Node.js SDK](https://github.com/watson-developer-cloud/node-sdk)
* [Relevancy Training Demo Video](https://www.youtube.com/watch?v=8BiuQKPQZJk)
* [Relevancy Training Demo Notebook](https://github.com/akmnua/relevancy_passage_bww)

<!-- pick the relevant ones from below -->
# Learn more

* **Artificial Intelligence Code Patterns**: Enjoyed this Code Pattern? Check out our other [AI Code Patterns](https://developer.ibm.com/code/technologies/artificial-intelligence/).
* **Data Analytics Code Patterns**: Enjoyed this Code Pattern? Check out our other [Data Analytics Code Patterns](https://developer.ibm.com/code/technologies/data-science/)
* **AI and Data Code Pattern Playlist**: Bookmark our [playlist](https://www.youtube.com/playlist?list=PLzUbsvIyrNfknNewObx5N7uGZ5FKH0Fde) with all of our Code Pattern videos
* **With Watson**: Want to take your Watson app to the next level? Looking to utilize Watson Brand assets? [Join the With Watson program](https://www.ibm.com/watson/with-watson/) to leverage exclusive brand, marketing, and tech resources to amplify and accelerate your Watson embedded commercial solution.
* **Data Science Experience**: Master the art of data science with IBM's [Data Science Experience](https://datascience.ibm.com/)
* **PowerAI**: Get started or get scaling, faster, with a software distribution for machine learning running on the Enterprise Platform for AI: [IBM Power Systems](https://www.ibm.com/ms-en/marketplace/deep-learning-platform)
* **Spark on IBM Cloud**: Need a Spark cluster? Create up to 30 Spark executors on IBM Cloud with our [Spark service](https://console.bluemix.net/catalog/services/apache-spark)
* **Kubernetes on IBM Cloud**: Deliver your apps with the combined the power of [Kubernetes and Docker on IBM Cloud](https://www.ibm.com/cloud-computing/bluemix/containers)

<!--keep this-->

# License
[Apache 2.0](LICENSE)
