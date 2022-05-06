const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { postAttachment } = require('../helper/routeHelper')

describe('authentication', function () {
  let app

  before(async function () {
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
})
