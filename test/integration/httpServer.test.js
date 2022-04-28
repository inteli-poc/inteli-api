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

  test('POST Order', async function () {
    const newProject = {
      owner: 'BAE',
      manufacturer: 'Maher',
      status: 'Accepted',
      required_by: new Date().toISOString(),
    }

    const response = await postOrderRoute(newProject, app)
    console.log(response.body)
    expect(response.status).to.equal(201)
    //assertPostProjectRequiredParams(response.body, newProject)
  })
})
