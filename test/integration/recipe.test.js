const createJWKSMock = require('mock-jwks').default
const { describe, before, it } = require('mocha')
const { expect } = require('chai')
const nock = require('nock')

const { createHttpServer } = require('../../app/server')
const { seed, cleanup } = require('../seeds/recipes')
const { postRecipeRoute } = require('../helper/routeHelper')
const { AUTH_ISSUER, AUTH_AUDIENCE, IDENTITY_SERVICE_HOST, IDENTITY_SERVICE_PORT } = require('../../app/env')

const logger = require('../../app/logger')

describe('Recipes', function () {
  describe('POST recipes', function () {
    this.timeout(15000)
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

    beforeEach(async function () {
      nock(`http://${IDENTITY_SERVICE_HOST}:${IDENTITY_SERVICE_PORT}`)
        .get('/v1/members/foobar3000')
        .reply(200, {
          alias: 'foobar3000',
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        })
        .get('/v1/members/invalid')
        .reply(404, {})
        .get('/v1/members/error')
        .reply(500, {})
    })

    afterEach(async function () {
      nock.cleanAll()
    })

    it('should accept valid body', async function () {
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'foobar3000',
      }

      const response = await postRecipeRoute(newRecipe, app, authToken)
      expect(response.status).to.equal(201)
      const { id: responseId, ...responseRest } = response.body
      expect(responseId).to.match(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
      )
      expect(responseRest).to.deep.equal(newRecipe)
    })

    it('should cause schema validation errors', async function () {
      logger.info('recipe test')
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-0000-0000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'foobar3000',
      }

      const response = await postRecipeRoute(newRecipe, app, authToken)
      expect(response.status).to.equal(400)
    })

    it('invalid attachment id errors', async function () {
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-2000-8000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'foobar3000',
      }

      const response = await postRecipeRoute(newRecipe, app, authToken)
      expect(response.status).to.equal(400)
      expect(response.text).to.equal('Attachment id not found')
    })

    it('invalid supplier name errors', async function () {
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'invalid',
      }

      const response = await postRecipeRoute(newRecipe, app, authToken)
      expect(response.status).to.equal(400)
      expect(response.text).to.equal('Member "invalid" does not exist')
    })

    it('identity server error propagates', async function () {
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'error',
      }

      const response = await postRecipeRoute(newRecipe, app, authToken)
      expect(response.status).to.equal(500)
      expect(response.text).to.equal('Internal server error')
    })
  })
})
