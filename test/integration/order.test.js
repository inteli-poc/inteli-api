const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const createJWKSMock = require('mock-jwks').default

const { createHttpServer } = require('../../app/server')
const { postOrderRoute, postRecipeRoute } = require('../helper/routeHelper')
const { seed, cleanup } = require('../seeds/orders')
const { AUTH_ISSUER, AUTH_AUDIENCE } = require('../../app/env')

describe('order', function () {
  describe('valid order', function () {
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

    test('POST Order - 201', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
        requiredBy: new Date().toISOString(),
        items: ['00000000-0000-1000-8000-000000000000'],
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(201)
      expect(response.body[0].owner).deep.equal(newProject.owner)
    })

    test('POST Order - Invalid UUID', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
        requiredBy: new Date().toISOString(),
        items: ['00000000-0000-1000-8000'],
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
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

    test('POST Order - Incorrect Status Enum', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Banana',
        requiredBy: new Date().toISOString(),
        items: [],
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order - Empty Request Body', async function () {
      const newProject = {}

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test.only('POST Order - Check ID & Manufacturer', async function () {
      const newRecipe = {
        externalId: 'foobar3000',
        name: 'foobar3000',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'foobar3000',
        alloy: 'foobar3000',
        price: 'foobar3000',
        requiredCerts: [{ description: 'foobar3000' }],
        supplier: 'Maher',
      }

      const recipeResponse = await postRecipeRoute(newRecipe, app, authToken)

      const newOrder = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
        requiredBy: new Date().toISOString(),
        items: [recipeResponse.body[0].id],
      }

      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.body[0].manufacturer).to.equal(recipeResponse.body[0].supplier)
      expect(response.body[0].items).to.contain(recipeResponse.body[0].id)
      expect(response.status).to.equal(201)
    })
  })
})
