const { describe, before, it } = require('mocha')
const nock = require('nock')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { postAttachment } = require('../helper/routeHelper')
const { getAuthToken } = require('../helper/auth')
const { lastTokenId } = require('../../app/api-v1/services/dscpApiService')

describe('authentication', function () {
  let app

  before(async function () {
    nock.cleanAll() // ensure nock isn't mocking auth
    app = await createHttpServer()
  })

  it('should return 401 - invalid token', async function () {
    const size = 100
    const filename = 'test.pdf'
    const authToken = 'badToken'
    const response = await postAttachment(app, Buffer.from('a'.repeat(size)), filename, authToken)

    expect(response.status).to.equal(401)
    expect(response.error.text).to.have.equal('An error occurred during jwks verification')
  })

  it('should return 200 - valid token for dscp-api - test user', async function () {
    const response = await lastTokenId(await getAuthToken())

    expect(response).to.have.property('id')
  })
})
