const createJWKSMock = require('mock-jwks').default
const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const { createHttpServer } = require('../../app/server')
const { postRecipeRoute } = require('../helper/routeHelper')
const { setupIdentityMock } = require('../helper/identityHelper')
const { seed, cleanup } = require('../seeds/recipes')
const { AUTH_ISSUER, AUTH_AUDIENCE, AUTH_TYPE, DSCP_API_HOST, DSCP_API_PORT } = require('../../app/env')
const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`
const nock = require('nock')

const describeAuthOnly = AUTH_TYPE === 'JWT' ? describe : describe.skip

describeAuthOnly('recipe- authenticated', function () {
  describe('valid recipe', function () {
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
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
    })

    after(async function () {
      await cleanup()
      await jwksMock.stop()
      nock.cleanAll()
    })

    setupIdentityMock()

    test('POST recipe - 201', async function () {
      const newRecipe = {
        externalId: 'another-external-system-id',
        name: 'Low-pressure compressor',
        imageAttachmentId: '00000000-0000-1000-8000-000000000001',
        material: 'Aluminium',
        alloy: 'Ti-6Al-4V',
        price: '1200',
        requiredCerts: [
          {
            description: 'tensionTest',
          },
        ],
        supplier: 'valid-1',
      }
      const response = await postRecipeRoute(newRecipe, app, authToken)

      expect(response.status).to.equal(201)
    })
  })
})
