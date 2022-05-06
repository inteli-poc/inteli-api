const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const createJWKSMock = require('mock-jwks').default

const { createHttpServer } = require('../../app/server')
const { postOrderRoute } = require('../helper/routeHelper')
const { AUTH_ISSUER, AUTH_AUDIENCE } = require('../../app/env')
const { cleanup } = require('../seeds/orders')

describe('order', function () {
  describe('valid order', function () {
    this.timeout(15000)
    let app
    let authToken
    let jwksMock

    before(async function () {
      app = await createHttpServer()
      jwksMock = createJWKSMock(AUTH_ISSUER)
      jwksMock.start()
      authToken = jwksMock.token({
        aud: AUTH_AUDIENCE,
        iss: AUTH_ISSUER,
      })
    })

    after(async function () {
      await cleanup()
      await jwksMock.stop()
    })

    test('POST Order - 201', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
        requiredBy: new Date().toISOString(),
        items: [],
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(201)
      expect(response.body[0].owner).deep.equal(newProject.owner)
    })

    test('POST Order with required Params missing - 400', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })
  })
})
