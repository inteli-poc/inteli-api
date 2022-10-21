const { expect } = require('chai')
const { stub } = require('sinon')

const db = require('../../../../db')
const identity = require('../../../services/identityService')
const { get, getById, create } = require('..')
const { recipeExample } = require('./transaction_fixtures')
const { fileAttachment } = require('../../Attachment/__tests__/attachments_fixtures')
const { BadRequestError, NotFoundError } = require('../../../../utils/errors')

const recipeCreatePayload = {
  body: {
    externalId: 'some-ext-id',
    name: 'recipe-name',
    imageAttachmentId: 'attachment-id',
    material: 'iron',
    alloy: 'metal',
    price: '1000.99',
    requiredCerts: { description: 'some descripton about this recipe' },
    supplier: 'supplier-alias',
  },
}

const createRecipe = async (req) => {
  try {
    return await create(req)
  } catch (err) {
    return err
  }
}

const getRecipes = async (req) => {
  try {
    return await get(req)
  } catch (err) {
    return err
  }
}

const getRecipeByID = async (req) => {
  try {
    return await getById(req)
  } catch (err) {
    return err
  }
}

describe('recipe controller', () => {
  let stubs = {}
  let response

  describe('/recipe - create new recipe locally', () => {
    beforeEach(async () => {
      stubs.getMemberByAlias = stub(identity, 'getMemberByAlias').resolves({ address: 'supplier-address' })
      stubs.getMemberBySelf = stub(identity, 'getMemberBySelf').resolves('self-address')
      stubs.getMemberByAddress = stub(identity, 'getMemberByAddress').resolves({ alias: 'self-alias' })
      stubs.getAttachment = stub(db, 'getAttachment').resolves([fileAttachment])
      stubs.addRecipe = stub(db, 'addRecipe').resolves([recipeExample])

      response = await createRecipe(recipeCreatePayload)
    })

    afterEach(() => {
      stubs.getMemberByAlias.restore()
      stubs.getMemberBySelf.restore()
      stubs.getMemberByAddress.restore()
      stubs.getAttachment.restore()
      stubs.addRecipe.restore()
    })

    describe('if req.body is not provided', () => {
      beforeEach(async () => {
        stubs.getMemberByAlias.restore()
        stubs.getMemberBySelf.restore()
        stubs.getMemberByAddress.restore()
        stubs.getAttachment.restore()
        stubs.addRecipe.restore()
        stubs.getMemberByAlias = stub(identity, 'getMemberByAlias')
        stubs.getMemberBySelf = stub(identity, 'getMemberBySelf')
        stubs.getMemberByAddress = stub(identity, 'getMemberByAddress')
        stubs.getAttachment = stub(db, 'getAttachment')
        stubs.addRecipe = stub(db, 'addRecipe')
        response = await createRecipe({})
      })

      it('throws bad request error', () => {
        expect(response).to.be.instanceOf(BadRequestError)
        expect(response.message).to.equal('Bad Request: no body provided')
      })

      it('does not call identity service', () => {
        expect(stubs.getMemberByAddress.calledOnce).to.equal(false)
        expect(stubs.getMemberBySelf.calledOnce).to.equal(false)
        expect(stubs.getMemberByAddress.calledOnce).to.equal(false)
      })

      it('does not attempt to retrieve an attachement', () => {
        expect(stubs.getAttachment.calledOnce).to.equal(false)
      })

      it('does not call addRecipe() database method', () => {
        expect(stubs.addRecipe.calledOnce).to.equal(false)
      })
    })

    describe('if identity service fails', () => {
      beforeEach(async () => {
        stubs.getAttachment.restore()
        stubs.addRecipe.restore()
        stubs.getAttachment = stub(db, 'getAttachment')
        stubs.addRecipe = stub(db, 'addRecipe')
        stubs.getMemberByAlias.rejects(new Error('some identity servive error'))
        response = await createRecipe(recipeCreatePayload)
      })

      it('throws and allows middle ware to take it from there', () => {
        expect(response).to.be.instanceOf(Error)
        expect(response.message).to.equal('some identity servive error')
      })

      it('does not attempt to retrieve an attachement', () => {
        expect(stubs.getAttachment.calledOnce).to.equal(false)
      })

      it('does not call addRecipe() database method', () => {
        expect(stubs.addRecipe.calledOnce).to.equal(false)
      })
    })

    describe('if getting attachment', () => {
      beforeEach(async () => {
        stubs.addRecipe.restore()
        stubs.getAttachment.rejects(new Error('some attachment db query error'))
        stubs.addRecipe = stub(db, 'addRecipe')

        response = await createRecipe(recipeCreatePayload)
      })

      it('throws and allows middle ware to take it from there', () => {
        expect(response).to.be.instanceOf(Error)
        expect(response.message).to.equal('some attachment db query error')
      })

      it('does not write to the database', () => {
        expect(stubs.addRecipe.calledOnce).to.equal(false)
      })
    })

    it('retrieves supplier alias from identity service', () => {
      expect(stubs.getMemberByAlias.getCall(0).args[1]).to.equal('supplier-alias')
    })

    it('retreves self address from identity service', () => {
      expect(stubs.getMemberBySelf.calledOnce).to.equal(true)
    })

    it('retrieves self alias from identity service', () => {
      expect(stubs.getMemberByAddress.getCall(0).args[1]).to.equal('self-address')
    })

    it('gets attachements from a local db', () => {
      expect(stubs.getAttachment.getCall(0).args[0]).to.equal('attachment-id')
    })

    it('persists recipe and returns 201 along with details', () => {
      const { status, response: body } = response
      expect(stubs.addRecipe.getCall(0).args[0]).to.deep.equal({
        name: 'recipe-name',
        image_attachment_id: '00000000-0000-1000-8000-000000000001',
        material: 'iron',
        alloy: 'metal',
        price: '1000.99',
        supplier: 'supplier-address',
        external_id: 'some-ext-id',
        required_certs: '{"description":"some descripton about this recipe"}',
        owner: 'self-address',
      })
      expect(status).to.equal(201)
      expect(body).to.deep.equal({
        id: '10000000-0000-1000-8000-0000000000000',
        externalId: 'some-ext-id',
        imageAttachmentId: 'attachment-id',
        owner: 'self-alias',
        name: 'recipe-name',
        requiredCerts: { description: 'some descripton about this recipe' },
        material: 'iron',
        alloy: 'metal',
        price: '1000.99',
        supplier: 'supplier-alias',
      })
    })
  })

  describe('/recipe - get all recipes endpoint', () => {
    beforeEach(async () => {
      stubs.getRecipes = stub(db, 'getRecipes').resolves([recipeExample])
      stubs.getMemberByAddress = stub(identity, 'getMemberByAddress')
        .onFirstCall()
        .returns({ alias: 'supplier-alias-test' })
        .onSecondCall()
        .returns({ alias: 'owner-alias-test' })
      response = await getRecipes({ query: {} })
    })

    afterEach(async () => {
      stubs.getRecipes.restore()
      stubs.getMemberByAddress.restore()
    })

    describe('if getRecipe method fails', () => {
      beforeEach(async () => {
        stubs.getRecipes.rejects(new Error('db client error here'))
        response = await getRecipes({ query: {} })
      })

      it('returns an instance of Error generate by the db client', () => {
        expect(response).to.be.instanceOf(Error)
        expect(response.message).to.equal('db client error here')
      })

      it('does noto make any calls to the identity service', () => {
        expect(stubs.getMemberByAddress.calledOnce).to.equal(false)
      })
    })

    describe('if identity service isnt available', () => {
      beforeEach(async () => {
        stubs.getMemberByAddress.rejects(new Error('identity service error'))
        response = await getRecipes({ query: {} })
      })

      it('returns an instance of Error that will be generated by identity service', () => {
        expect(response).to.be.instanceOf(Error)
        expect(response.message).to.equal('identity service error')
      })
    })

    it('retrieves all recipes from a local database', () => {
      expect(stubs.getRecipes.calledOnce).to.equal(true)
    })

    it('gets supplier alias from identity service', () => {
      expect(stubs.getMemberByAddress.getCall(0).args[1]).to.equal(recipeExample.supplier)
    })

    it('gets owner alias from identity service', () => {
      expect(stubs.getMemberByAddress.getCall(1).args[1]).to.equal(recipeExample.owner)
      expect(stubs.getMemberByAddress.callCount).to.equal(2)
    })

    it('returns a formatted array of recipes', () => {
      const { status, response: body } = response
      expect(status).to.equal(200)
      expect(body).to.be.instanceOf(Array)
      expect(body).to.deep.equal([
        {
          id: '10000000-0000-1000-8000-0000000000000',
          externalId: 'TEST-externalId',
          name: 'TEST-name',
          imageAttachmentId: '00000000-0000-1000-8000-000000000000',
          material: 'TEST-material',
          alloy: 'TEST-alloy',
          price: '99.99',
          requiredCerts: [
            {
              description: 'TEST-certificate',
            },
          ],
          supplier: 'supplier-alias-test',
          owner: 'owner-alias-test',
        },
      ])
    })
  })

  describe('/recipe/{id} - get by id endpoint', () => {
    let stubs = {}
    beforeEach(async () => {
      stubs.getRecipeByIDdb = stub(db, 'getRecipeByIDdb').resolves([recipeExample])
      stubs.getMemberByAddress = stub(identity, 'getMemberByAddress')
        .onFirstCall()
        .returns({ alias: recipeExample.supplier })
        .onSecondCall()
        .returns({ alias: recipeExample.owner })
      response = await getRecipeByID({ params: { id: recipeExample.id } })
    })

    afterEach(() => {
      stubs.getRecipeByIDdb.restore()
      stubs.getMemberByAddress.restore()
    })

    describe('if req.params.id is not provided', () => {
      beforeEach(async () => {
        stubs.getRecipeByIDdb.restore()
        stubs.getRecipeByIDdb = stub(db, 'getRecipeByIDdb').resolves([])
        response = await getRecipeByID({ params: {} })
      })

      it('throws a validation error', async () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('Bad Request: missing params')
      })

      it('does not perform any database calls', () => {
        expect(stubs.getRecipeByIDdb.calledOnce).to.equal(false)
      })
    })

    describe('if no recipes are found with a given ID', () => {
      beforeEach(async () => {
        stubs.getRecipeByIDdb.resolves([])
        response = await getRecipeByID({ params: { id: '1000000-2000-7000-8000-000000000000' } })
      })

      it('throws an error', () => {
        expect(response.code).to.be.equal(404)
        expect(response).to.be.an.instanceOf(NotFoundError)
        expect(response.message).to.be.equal('Not Found: Recipe Not Found')
      })
    })

    it('returns a recipe', () => {
      const { status, response: body } = response
      expect(status).to.be.equal(200)
      expect(body).to.deep.equal({
        id: '10000000-0000-1000-8000-0000000000000',
        externalId: 'TEST-externalId',
        name: 'TEST-name',
        imageAttachmentId: '00000000-0000-1000-8000-000000000000',
        material: 'TEST-material',
        alloy: 'TEST-alloy',
        price: '99.99',
        requiredCerts: [
          {
            description: 'TEST-certificate',
          },
        ],
        supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
        owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
      })
    })
  })
})
