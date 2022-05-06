const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { seed, cleanup } = require('../seeds/recipes')
const { postRecipeRoute } = require('../helper/routeHelper')

const logger = require('../../app/logger')

describe('Recipes', function () {
  describe('POST recipes', function () {
    this.timeout(15000)
    let app

    before(async function () {
      await seed()
      app = await createHttpServer()
    })

    after(async function () {
      await cleanup()
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

      const response = await postRecipeRoute(newRecipe, app)
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

      const response = await postRecipeRoute(newRecipe, app)
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
        supplier: 'foobar3000',
      }

      const response = await postRecipeRoute(newRecipe, app)
      expect(response.status).to.equal(400)
      expect(response.text).to.equal('Attachment id not found')
    })
  })
})
