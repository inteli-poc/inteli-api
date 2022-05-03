/* eslint no-console: "off" */
const request = require('supertest')

const { API_MAJOR_VERSION } = require('../../app/env')

async function apiDocs({ app }) {
  return request(app)
    .get(`/${API_MAJOR_VERSION}/api-docs`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`healthCheckErr ${err}`)
      return err
    })
}

async function healthCheck({ app }) {
  return request(app)
    .get('/health')
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`healthCheckErr ${err}`)
      return err
    })
}

async function postOrderRoute(order, { app }) {
  return request(app)
    .post(`/${API_MAJOR_VERSION}/order`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .send(order)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`postOrderErr ${err}`)
      return err
    })
}

module.exports = {
  apiDocs,
  healthCheck,
  postOrderRoute,
}
