const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const createJWKSMock = require('mock-jwks').default
const nock = require('nock')

const { createHttpServer } = require('../../app/server')
const { postOrderRoute, postRecipeRoute } = require('../helper/routeHelper')
const { seed, cleanup } = require('../seeds/orders')
const { AUTH_ISSUER, AUTH_AUDIENCE, IDENTITY_SERVICE_HOST, IDENTITY_SERVICE_PORT } = require('../../app/env')

describe('order', function () {
  describe('valid order', function () {
    this.timeout(3000)
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
        .persist()
        .get('/v1/members/foobar3000')
        .reply(200, {
          alias: 'foobar3000',
          address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        })
        .get('/v1/members/invalid')
        .reply(404, {})
        .get('/v1/members/error')
        .reply(500, {})

      nock(`http://${IDENTITY_SERVICE_HOST}:${IDENTITY_SERVICE_PORT}`)
        .persist()
        .get('/v1/members/supplier3000')
        .reply(200, {
          alias: 'supplier3000',
          address: '4FHold46xGXgs5mUiveU2sbTyGBzmstUspZC92UhjJM694jz',
        })
        .get('/v1/members/invalid')
        .reply(404, {})
        .get('/v1/members/error')
        .reply(500, {})
    })

    afterEach(async function () {
      nock.cleanAll()
    })

    test('POST Order with existing supplier - 201', async function () {
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

      const recipeResponse = await postRecipeRoute(newRecipe, app, authToken)
      const newOrder = {
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
        items: [recipeResponse.body.id],
      }
      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.status).to.equal(201)
      expect(response.body.supplier).deep.equal(newOrder.supplier)
    })

    test('POST Order with existing supplier - 201', async function () {
      const newRecipe = {
        externalId: 'supplier3000',
        name: 'supplier3000',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'supplier3000',
        alloy: 'supplier3000',
        price: 'supplier3000',
        requiredCerts: [{ description: 'supplier3000' }],
        supplier: 'supplier3000',
      }

      const recipeResponse = await postRecipeRoute(newRecipe, app, authToken)
      const newOrder = {
        supplier: 'supplier3000',
        requiredBy: new Date().toISOString(),
        items: [recipeResponse.body.id],
      }

      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.status).to.equal(201)
      expect(response.body.supplier).deep.equal(newOrder.supplier)
    })

    test('POST Order with existing supplier and non existing supplier - 422', async function () {
      const newRecipe = {
        externalId: 'supplier3000',
        name: 'supplier3000',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'supplier3000',
        alloy: 'supplier3000',
        price: 'supplier3000',
        requiredCerts: [{ description: 'supplier3000' }],
        supplier: 'supplier3000',
      }

      const recipeResponse = await postRecipeRoute(newRecipe, app, authToken)
      const newOrder = {
        supplier: 'supplier3000',
        requiredBy: new Date().toISOString(),
        items: [recipeResponse.body.id, '10000000-0000-2000-9000-000000000000'],
      }

      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.status).to.equal(422)
    })

    test('POST Order with non-existant supplier - 422', async function () {
      const newProject = {
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
        items: ['00000000-0000-1000-8000-000000000000'],
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(422)
    })

    test('POST Order - Invalid UUID', async function () {
      const newProject = {
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
        items: ['00000000-0000-1000-8000'],
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order with required Params missing - 400', async function () {
      const newProject = {
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order - Empty Request Body', async function () {
      const newProject = {}

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order - Check ID & Manufacturer', async function () {
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

      const recipeResponse = await postRecipeRoute(newRecipe, app, authToken)
      const newOrder = {
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
        items: [recipeResponse.body.id],
      }

      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.body.supplier).to.equal(recipeResponse.body.supplier)
      expect(response.body.items).to.contain(recipeResponse.body.id)
      expect(response.status).to.equal(201)
    })

    test('POST Order - Check ID & Manufacturer - FAIL', async function () {
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

      const recipeResponse = await postRecipeRoute(newRecipe, app, authToken)

      const newOrder = {
        supplier: 'supplier3000',
        requiredBy: new Date().toISOString(),
        items: [recipeResponse.body.id],
      }

      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.status).to.equal(422)
    })
  })
})
