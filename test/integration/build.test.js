const createJWKSMock = require('mock-jwks').default
const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const { createHttpServer } = require('../../app/server')
const { postBuildRoute } = require('../helper/routeHelper')
const { setupIdentityMock } = require('../helper/identityHelper')
const { seed, cleanup } = require('../seeds/build')
const { AUTH_ISSUER, AUTH_AUDIENCE, AUTH_TYPE } = require('../../app/env')

const describeAuthOnly = AUTH_TYPE === 'JWT' ? describe : describe.skip

describeAuthOnly('build- authenticated', function () {
  describe('valid build', function () {
    this.timeout(10000)
    let app
    let authToken
    let jwksMock

    before(async function () {
      await seed()
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

    setupIdentityMock()

    test('POST Build - 201', async function () {
      const newBuild = {
        externalId: 'some-external-system-id',
        partIds: ['7989218f-fdc3-4f4c-a772-bae5f9e06994'],
        completionEstimate: '2022-08-16T11:00:58.162Z',
      }
      const response = await postBuildRoute(newBuild, app, authToken)

      expect(response.status).to.equal(201)
    })
  })
})
