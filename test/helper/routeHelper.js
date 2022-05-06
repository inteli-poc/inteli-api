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

async function postRecipeRoute(recipe, { app }, token) {
  return request(app)
    .post(`/${API_MAJOR_VERSION}/recipe`)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .send(recipe)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`postRecipeErr ${err}`)
      return err
    })
}

async function postAttachment({ app }, fileData, filename, token) {
  return request(app)
    .post(`/${API_MAJOR_VERSION}/attachment`)
    .set('Accept', 'application/json')
    .set('Content-type', 'multipart/form-data')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', fileData, filename)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`postAttachmentErr ${err}`)
      return err
    })
}

async function postAttachmentNoFile({ app }, token) {
  return request(app)
    .post(`/${API_MAJOR_VERSION}/attachment`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${token}`)
    .then((response) => {
      return response
    })
    .catch((err) => {
      console.error(`postAttachmentErr ${err}`)
      return err
    })
}

module.exports = {
  apiDocs,
  healthCheck,
  postRecipeRoute,
  postAttachment,
  postAttachmentNoFile,
}
