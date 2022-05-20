const createJWKSMock = require('mock-jwks').default
const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const seed = require('../seeds/recipes')
const { postRecipeRoute, getRecipeRoute, getRecipeByIdRoute } = require('../helper/routeHelper')
const { setupIdentityMock } = require('../helper/identityHelper')
const recipesFixture = require('../fixtures/recipes')
const { AUTH_ISSUER, AUTH_AUDIENCE, IDENTITY_SERVICE_HOST, IDENTITY_SERVICE_PORT } = require('../../app/env')
const nock = require('nock')

const logger = require('../../app/utils/Logger')

describe('Recipes', function () {
  describe('POST recipes', function () {
    this.timeout(5000)
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
      setupIdentityMock()
    })

    beforeEach(() => {
      nock(`http://${IDENTITY_SERVICE_HOST}:${IDENTITY_SERVICE_PORT}`)
        .persist()
        .get('/v1/members/foobar3000')
        .reply(200, {
          alias: 'alias',
          address: 'foobar3000',
        })
        .persist()
        .get('/v1/members/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutAA')
        .reply(200, {
          alias: 'alias',
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutAA',
        })
    })

    after(async function () {
      await jwksMock.stop()
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
        supplier: 'valid-1',
      }

      const response = await postRecipeRoute(newRecipe, app, authToken)
      expect(response.status).to.equal(400)
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
    })

    it('invalid attachment id returns null', async function () {
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-2000-8000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'valid-1',
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

  describe('GET recipes', function () {
    this.timeout(5000)
    let app
    let authToken
    let jwksMock

    before(async () => {
      await seed()
      app = await createHttpServer()
      jwksMock = createJWKSMock(AUTH_ISSUER)
      jwksMock.start()
      authToken = jwksMock.token({
        aud: AUTH_AUDIENCE,
        iss: AUTH_ISSUER,
      })
    })

    beforeEach(async function () {
      nock(`http://${IDENTITY_SERVICE_HOST}:${IDENTITY_SERVICE_PORT}`)
        .persist()
        .get('/v1/members/foobar3000')
        .reply(200, {
          alias: 'foobar3000-alias',
          address: 'foobar3000',
        })
        .persist()
        .get('/v1/members/valid-1')
        .reply(200, {
          alias: 'valid-alias-1',
          address: 'valid-1',
        })
        .persist()
        .get('/v1/members/valid-2')
        .reply(200, {
          alias: 'valid-alias-2',
          address: 'valid-2',
        })
        .persist()
        .get('/v1/members/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutAA')
        .reply(200, {
          alias: 'alias',
          address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutAA',
        })
    })

    setupIdentityMock()

    after(async function () {
      await jwksMock.stop()
      nock.cleanAll()
    })

    it('should get recipe by id - 200', async function () {
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

      const recipe = await postRecipeRoute(newRecipe, app, authToken)
      const response = await getRecipeByIdRoute(app, recipe.body.id, authToken)
      expect(response.status).to.equal(200)
    })

    it('should accept valid body', async function () {
      const recipes = await Promise.all(
        recipesFixture.map(async (newRecipe) => {
          const { body: recipe } = await postRecipeRoute(newRecipe, app, authToken)
          return recipe
        })
      )

      const { status, body } = await getRecipeRoute(app, authToken)
      expect(status).to.equal(200)
      expect(body).to.be.an('array')
      const ids = recipes.map(({ id }) => id)
      body
        .filter(({ id }) => ids.includes(id))
        .map((recipe, i) => {
          expect(recipes[i]).to.deep.contains(recipe)
        })
    })

    it('should fail to get by non-existant id - 404', async function () {
      const response = await getRecipeByIdRoute(app, '11111111-ba46-4871-9d91-63248be7b884', authToken)
      expect(response.status).to.equal(404)
    })

    it('should return a 400 with an incorrect ID format', async function () {
      const response = await getRecipeByIdRoute(app, '63248be7b884', authToken)
      expect(response.status).to.equal(400)
    })
  })
})
