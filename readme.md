# Documentation for Stripe Connect module

#### Shortcuts

- [Documentation website](https://layeredapps.github.io)
- [Module documentation](https://layeredapps.github.io/stripe-connect-module)
- [UI screenshots](https://layeredapps.github.io/stripe-connect-ui)
- [API documentation](https://layeredapps.github.io/stripe-connect-api)
- [Environment configuration](https://layeredapps.github.io/stripe-connect-configuration)

#### Index

- [Introduction](#introduction)
- [Import this module](#import-this-module)
- [Setting up your Stripe credentials](#setting-up-your-stripe-credentials)
- [Provided server, content and proxy handlers](#provided-server-content-and-proxy-handlers)
- [Storage engine](#storage-engine)
- [Access the API](#access-the-api)
- [Github repository](https://github.com/layeredapps/stripe-connect)
- [NPM package](https://npmjs.org/layeredapps/stripe-connect)

# Introduction

Dashboard bundles everything a web app needs, all the "boilerplate" like signing in and changing passwords, into a parallel server so you can write a much smaller web app.

The Stripe Connect module adds a complete "custom" integration of Stripe's Connect API, allowing your users to provide personal or company information and receive payouts on your platform.  A UI is provided for users to create and manage their registrations, and a basic administrator UI is provided for oversight.  When a user has completed a Stripe account registration and it has been approved by Stripe their status will be changed to `payouts_enabled` and your application can use this property to control access to your platform functionality.

Currently only automatic payouts are supported.  Countries that are "in beta" support by Stripe are not supported and need to be added as they become generally available.  The [Stripe API documentation](https://stripe.com/docs/api) supplements this documentation.

## Import this module

Install the module with NPM:

    $ npm install @layeredapps/stripe-connect

Edit your `package.json` to activate the module:

    "dashboard": {
      "modules": [
        "@layeredapps/stripe-connect"
      ]
    }

## Setting up your Stripe credentials

You will need to retrieve various keys from [Stripe](https://stripe.com).  During development your webhook will be created automatically, but in production with multiple dashboard server instances they share a configured webhook:

- create your Stripe account and find your API keys
- create a webhook for https://your_domain/webhooks/connect/index-connect-data 
- environment STRIPE_KEY=sk_test_xxxxxxx
- environment STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxx
- environment CONNECT_WEBHOOK_ENDPOINT_SECRET=whsec_xxxxxxxx

# Provided server, content and proxy handlers

This module comes with some convenience scripts you can add to your `package.json`:

| Type     | Script path                                                                    | Description                                                                                                                                                                                                                                                                                                                                                                                      |
|----------|--------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| proxy    | @layeredapps/stripe-connect/src/proxy/x-has-active-stripe-account.js           | Sets `x-has-active-stripe-account` to `true` or `false` if the user has a Stripe account with `payouts_enabled`.                                                                                                                                                                                                                                                                                 |
| proxy    | @layeredapps/stripe-connect/src/proxy/x-stripe-accounts-active.js              | Dashboard will bundle the user's `active` Stripe Account objects in `x-stripe-accounts-active` header.                                                                                                                                                                                                                                                                                           |
| proxy    | @layeredapps/stripe-connect/src/proxy/x-stripe-accounts-pending.js             | Dashboard will bundle the user's `pending approval` Stripe Account objects in `x-stripe-accounts-pending` header.                                                                                                                                                                                                                                                                                |
| proxy    | @layeredapps/stripe-connect/src/proxy/x-stripe-accounts-requiring.js           | Dashboard will bundle the user's `requiring information` Stripe Account objects in `x-stripe-accounts-requiring` header.                                                                                                                                                                                                                                                                         |
| proxy    | @layeredapps/stripe-connect/src/proxy/x-stripe-accounts.js                     | Dashboard will bundle the user's Stripe Account objects in `x-stripe-accounts` header.                                                                                                                                                                                                                                                                                                           |
| server   | @layeredapps/stripe-connect/src/server/bind-stripekey.js                       | The Stripe API key object will be bound to `req.stripeKey`.                                                                                                                                                                                                                                                                                                                                      |                                                                                                                                                                                                                                                                                                                                    |
| server   | @layeredapps/stripe-connect/src/server/check-before-delete-stripe-account.js   | Require users complete steps, such as deleting subscriptions, before deleting their Stripe account.  Set a `CHECK_BEFORE_DELETE_STRIPE_ACCOUNT` path such as `/check-delete` on your Application server, Dashboard will query this API passing `?stripeid=xxxxx` and you may respond with { "redirect": "/your-delete-requirements" } or { "redirect": false }" to enforce the requirements.     |
| server   | @layeredapps/stripe-connect/src/server/require-all-information-submitted.js    | If the user has Stripe account(s) requiring information they will be redirected to provide it.  They can still access `/account` and `/administrator` routes (if an administrator)                                                                                                                                                                                                               |
| server   | @layeredapps/stripe-connect/src/server/require-connect-account.js              | If the user does not have an `active` Stripe account with payouts enabled they will be redirected to create one.  They can still access `/account` and `/administrator` routes (if an administrator)                                                                                                                                                                                             |

## Storage engine

By default this module will share whatever storage you use for Dashboard.  You can specify nothing, specify an alternate storage backend, or specify the same type with a separate database.

    CONNECT_STORAGE=mysql
    CONNECT_DATABASE_URL=mysql://...
    CONNECT_MAX_CONNECTIONS=
    CONNECT_IDLE_CONNECTION_LIMIT= 

If your Dashboard is configured with database read replication servers this module will follow that configuration.  You can also specify module-specific read replication:

    CONNECT_STORAGE_REPLICATION=true
    CONNECT_DATABASE_URL=postgres://1.0.0.0:5432/connect
    CONNECT_READ_DATABASE_URL1=postgres://1.0.0.1:5432/connect
    CONNECT_READ_DATABASE_URL2=postgres://1.0.0.2:5432/connect
    CONNECT_READ_DATABASE_URL#=postgres://1.0.0.3:5432/connect

### Access the API

Dashboard and official modules are completely API-driven and you can access the same APIs on behalf of the user making requests.  You perform `GET`, `POST`, `PATCH`, and `DELETE` HTTP requests against the API endpoints to fetch or modify data.  This example fetches the user's Connect accounts using NodeJS, you can do this with any language:

You can view API documentation within the NodeJS modules' `api.txt` files, or on the [documentation site](https://layeredapps.github.io/stripe-connect-api).

    const stripeAccounts = await proxy(`/api/user/connect/stripe-accounts?accountid=${accountid}&all=true`, accountid, sessionid)

    const proxy = util.promisify((path, accountid, sessionid, callback) => {
        const requestOptions = {
            host: 'dashboard.example.com',
            path: path,
            port: '443',
            method: 'GET',
            headers: {
                'x-application-server': 'application.example.com',
                'x-application-server-token': process.env.APPLICATION_SERVER_TOKEN,
                'x-accountid': accountid,
                'x-sessionid': sessionid
            }
        }
        const proxyRequest = require('https').request(requestOptions, (proxyResponse) => {
            let body = ''
            proxyResponse.on('data', (chunk) => {
                body += chunk
            })
            return proxyResponse.on('end', () => {
                return callback(null, JSON.parse(body))
            })
        })
        proxyRequest.on('error', (error) => {
            return callback(error)
        })
        return proxyRequest.end()
      })
    }
