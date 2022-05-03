const { describe, before, test } = require('mocha')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { API_VERSION } = require('../../app/env')
const { healthCheck, postOrderRoute } = require('../helper/routeHelper')

describe('health', function () {
  let app

  before(async function () {
    app = await createHttpServer()
  })

  test('health check', async function () {
    const expectedResult = { status: 'ok', version: API_VERSION }

    const actualResult = await healthCheck(app)
    expect(actualResult.status).to.equal(200)
    expect(actualResult.body).to.deep.equal(expectedResult)
  })

  test('POST Order - 201', async function () {
    const newProject = {
      owner: 'BAE',
      manufacturer: 'Maher',
      status: 'Accepted',
      requiredBy: new Date().toISOString(),
      items: [],
    }

    const response = await postOrderRoute(newProject, app)
    expect(response.status).to.equal(201)
    expect(response.body[0].owner).deep.equal(newProject.owner)
  })

  test('POST Order with required Params missing - 400', async function () {
    const newProject = {
      owner: 'BAE',
      manufacturer: 'Maher',
      status: 'Accepted',
    }

    const response = await postOrderRoute(newProject, app)
    expect(response.status).to.equal(400)
  })
})
