const { expect } = require('chai')
const recipeController = require('../index')
const { stub } = require('sinon')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')
const nock = require('nock')
const { DSCP_API_HOST, DSCP_API_PORT } = require('../../../../env')
const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`

describe('recipe.get', () => {
  let stubs = {}
  let req = { query: {} }
  beforeEach(async () => {
    stubs.getRecipes = stub(db, 'getRecipes').resolves([
      {
        externalId: 'another-external-system-id',
        name: 'Low-pressure compressor',
        imageAttachmentId: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
        material: 'Aluminium',
        alloy: 'Ti-6Al-4V',
        price: '1200',
        requiredCerts: [
          {
            description: 'tensionTest',
          },
        ],
        supplier: 'bob',
      },
    ])
    stubs.getMemberByAddress = stub(identityService, 'getMemberByAddress')
      .onFirstCall()
      .resolves({ alias: 'supplier-alias' })
    stubs.getMemberByAddress.onSecondCall().resolves({ alias: 'owner-alias' })
  })
  afterEach(async () => {
    stubs.getRecipes.restore()
    stubs.getMemberByAddress.restore()
  })
  it('should resolve to 200', async () => {
    const result = await recipeController.get(req)
    expect(result.status).to.equal(200)
  })
})

describe('recipe.getById', () => {
  let stubs = {}
  let req = { params: { id: '7afb3af3-361e-4dc9-9a32-1922fa9837a0' } }
  beforeEach(async () => {
    stubs.getRecipeByIDdb = stub(db, 'getRecipeByIDdb').resolves([
      {
        externalId: 'another-external-system-id',
        name: 'Low-pressure compressor',
        imageAttachmentId: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
        material: 'Aluminium',
        alloy: 'Ti-6Al-4V',
        price: '1200',
        requiredCerts: [
          {
            description: 'tensionTest',
          },
        ],
        supplier: 'bob',
      },
    ])
    stubs.getMemberByAddress = stub(identityService, 'getMemberByAddress')
      .onFirstCall()
      .resolves({ alias: 'supplier-alias' })
    stubs.getMemberByAddress.onSecondCall().resolves({ alias: 'owner-alias' })
  })
  afterEach(async () => {
    stubs.getRecipeByIDdb.restore()
    stubs.getMemberByAddress.restore()
  })
  it('should resolve to 200', async () => {
    const result = await recipeController.getById(req)
    expect(result.status).to.equal(200)
  })
})

describe('recipe.create', () => {
  let stubs = {}
  let req = {
    body: {
      externalId: 'another-external-system-id',
      name: 'Low-pressure compressor',
      imageAttachmentId: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
      material: 'Aluminium',
      alloy: 'Ti-6Al-4V',
      price: '1200',
      requiredCerts: [
        {
          description: 'tensionTest',
        },
      ],
      supplier: 'bob',
    },
  }
  beforeEach(async () => {
    stubs.getMemberByAlias = stub(identityService, 'getMemberByAlias').resolves({
      address: 'd3607fc8-442a-4394-a96e-042bd97f0624',
    })
    stubs.getMemberBySelf = stub(identityService, 'getMemberBySelf').resolves('d3607fc8-442a-4394-a96e-042bd97f0624')
    stubs.getMemberByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'buyer-alias' })
    stubs.getAttachment = stub(db, 'getAttachment').resolves([
      {
        id: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
      },
    ])
    stubs.addRecipe = stub(db, 'addRecipe').resolves([
      {
        id: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
      },
    ])
    stubs.recipeTransactionCreate = stub(recipeController.transaction, 'create').resolves({ status: 201 })
  })
  afterEach(async () => {
    stubs.getMemberByAlias.restore()
    stubs.getMemberBySelf.restore()
    stubs.getMemberByAddress.restore()
    stubs.getAttachment.restore()
    stubs.addRecipe.restore()
    stubs.recipeTransactionCreate.restore()
  })
  it('should resolve to 201', async () => {
    const result = await recipeController.create(req)
    expect(result.status).to.equal(201)
  })
})

describe('recipe.transaction', () => {
  describe('create', () => {
    let stubs = {}
    let req = { params: { id: '7afb3af3-361e-4dc9-9a32-1922fa9837a0' } }
    beforeEach(async () => {
      stubs.getRecipe = stub(db, 'getRecipe').resolves([
        {
          binary_blob: Buffer.from('some-random-content'),
          owner: 'd3607fc8-442a-4394-a96e-042bd97f0624',
          supplier: 'd3607fc8-442a-4394-a96e-042bd97f0624',
          image_attachment_id: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
          required_certs: [{ description: 'tensionTest' }],
          external_id: 'another-external-system-id',
          name: 'Low-pressure compressor',
          material: 'Aluminium',
          alloy: 'Ti-6Al-4V',
          price: '1200',
          id: '7afb3af3-361e-4dc9-9a32-1922fa9837a0',
        },
      ])
      stubs.insertRecipeTransaction = stub(db, 'insertRecipeTransaction').resolves({
        id: '48d84d18-802e-4cb7-8997-f84dfc03b5a5',
        status: 'Submitted',
        created_at: '2022-08-23T11:17:08.263Z',
      })
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
      stubs.updateRecipeTransactions = stub(db, 'updateRecipeTransactions').resolves([])
      stubs.updateRecipe = stub(db, 'updateRecipe').resolves([])
    })
    afterEach(async () => {
      stubs.getRecipe.restore()
      stubs.insertRecipeTransaction.restore()
      stubs.updateRecipeTransactions.restore()
      stubs.updateRecipe.restore()
    })
    it('should resolve 201', async () => {
      const result = await recipeController.transaction.create(req)
      expect(result.status).to.equal(201)
    })
  })
})
