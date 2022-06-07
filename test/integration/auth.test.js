const { describe, before, it } = require('mocha')
const nock = require('nock')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { postAttachment } = require('../helper/routeHelper')
const { AUTH_TYPE } = require('../../app/env')

const describeAuthOnly = AUTH_TYPE === 'JWT' ? describe : describe.skip

describeAuthOnly('authentication', function () {
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
    expect(response.body).to.deep.equal({ message: 'An error occurred during jwks verification' })
  })
})
