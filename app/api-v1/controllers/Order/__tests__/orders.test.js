const { expect } = require('chai')
const orderController = require('../index')
const partController = require('../../Part/index')
const { stub } = require('sinon')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')
const nock = require('nock')
const { DSCP_API_HOST, DSCP_API_PORT } = require('../../../../env')
const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`

describe('order.get', () => {
  let stubs = {}
  let req = { query: {} }
  beforeEach(async () => {
    stubs.getOrders = stub(db, 'getOrders').resolves([
      {
        external_id: 'some-external-d',
        supplier: 'supplier-alias',
        items: ['d3607fc8-442a-4394-a96e-042bd97f0624'],
        business_partner_code: 'some-business-partner-code',
        id: 'd3607fc8-442a-4394-a96e-042bd97f061',
        status: 'Submitted',
        updated_at: new Date(),
      },
    ])
    stubs.identityByAddress = stub(identityService, 'getMemberByAddress')
      .onFirstCall()
      .resolves({ alias: 'supplier-alias' })
    stubs.identityByAddress.onSecondCall().resolves({ alias: 'buyer-alias' })
    stubs.getPartById = stub(db, 'getPartById').resolves([
      {
        build_id: 'd3607fc8-442a-4394-a96e-042bd97f0625',
        forecast_delivery_date: new Date(),
        required_by: new Date(),
        confirmed_receipt_date: new Date(),
      },
    ])
    stubs.getBuildById = stub(db, 'getBuildById').resolves([
      {
        status: 'Started',
        updated_at: new Date(),
        external_id: 'some-external-id',
      },
    ])
    stubs.getRecipeByIDdb = stub(db, 'getRecipeByIDdb').resolves([
      {
        id: 'some-id',
        external_id: 'some-external-id',
        name: 'some-name',
        price: 'some-price',
      },
    ])
  })
  afterEach(async () => {
    stubs.getOrders.restore()
    stubs.identityByAddress.restore()
    stubs.getPartById.restore()
    stubs.getBuildById.restore()
    stubs.getRecipeByIDdb.restore()
  })
  it('should resolve to 200', async () => {
    const result = await orderController.get(req)
    expect(result.status).to.equal(200)
  })
})

describe('order.getById', () => {
  let stubs = {}
  let req = { params: { id: 'd3607fc8-442a-4394-a96e-042bd97f0624' } }
  beforeEach(async () => {
    stubs.getOrder = stub(db, 'getOrder').resolves([
      {
        external_id: 'some-external-d',
        supplier: 'supplier-alias',
        items: ['d3607fc8-442a-4394-a96e-042bd97f0624'],
        business_partner_code: 'some-business-partner-code',
        id: 'd3607fc8-442a-4394-a96e-042bd97f061',
        status: 'Submitted',
        updated_at: new Date(),
      },
    ])
    stubs.identityByAddress = stub(identityService, 'getMemberByAddress')
      .onFirstCall()
      .resolves({ alias: 'supplier-alias' })
    stubs.identityByAddress.onSecondCall().resolves({ alias: 'buyer-alias' })
  })
  afterEach(async () => {
    stubs.getOrder.restore()
    stubs.identityByAddress.restore()
  })
  it('should resolve to 200', async () => {
    const result = await orderController.getById(req)
    expect(result.status).to.equal(200)
  })
})

describe('order.create', () => {
  let stubs = {}
  let req = {
    body: {
      externalId: 'some-external-d',
      supplier: 'bob',
      items: [
        {
          requiredBy: '2022-09-23T09:30:51.190Z',
          recipeId: 'd3607fc8-442a-4394-a96e-042bd97f0624',
          price: 1100,
          quantity: 1,
          currency: 'some-currency',
          deliveryTerms: 'some-delivery-terms',
          deliveryAddress: 'some-delivery-address',
          lineText: 'some-line-text',
          exportClassification: 'some-export-classification',
          unitOfMeasure: 'some-unit-of-measure',
          priceType: 'some-price-type',
          confirmedReceiptDate: '2022-09-23T09:30:51.190Z',
          description: 'some-description',
        },
      ],
      businessPartnerCode: 'some-business-partner-code',
    },
  }
  beforeEach(async () => {
    stubs.getMemberByAlias = stub(identityService, 'getMemberByAlias').resolves({
      address: 'd3607fc8-442a-4394-a96e-042bd97f0624',
    })
    stubs.getMemberBySelf = stub(identityService, 'getMemberBySelf').resolves('d3607fc8-442a-4394-a96e-042bd97f0624')
    stubs.getMemberByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'buyer-alias' })
    stubs.partPost = stub(partController, 'post').resolves({
      response: {
        id: 'd3607fc8-442a-4394-a96e-042bd97f0624',
      },
    })
    stubs.partCreateInnerFn = stub().resolves([])
    stubs.partCreate = stub(partController.transaction, 'create').returns(stubs.partCreateInnerFn)
    stubs.postOrderDb = stub(db, 'postOrderDb').resolves([
      {
        id: 'd3607fc8-442a-4394-a96e-042bd97f0624',
      },
    ])
    stubs.getPartByIDs = stub(db, 'getPartByIDs').resolves([
      {
        id: 'd3607fc8-442a-4394-a96e-042bd97f0624',
        latest_token_id: 1,
      },
    ])
    stubs.updatePart = stub(db, 'updatePart').resolves([])
    stubs.orderCreationInnerFn = stub().resolves({
      response: {
        updatedAt: new Date(),
      },
    })
    stubs.orderTransactionCreate = stub(orderController.transaction, 'create').returns(stubs.orderCreationInnerFn)
    stubs.getPartById = stub(db, 'getPartById').resolves([
      {
        build_id: 'd3607fc8-442a-4394-a96e-042bd97f0627',
      },
    ])
    stubs.getBuildById = stub(db, 'getBuildById').resolves([])
  })
  afterEach(async () => {
    stubs.getMemberByAlias.restore()
    stubs.getMemberBySelf.restore()
    stubs.getMemberByAddress.restore()
    stubs.partPost.restore()
    stubs.partCreate.restore()
    stubs.postOrderDb.restore()
    stubs.getPartByIDs.restore()
    stubs.updatePart.restore()
    stubs.orderTransactionCreate.restore()
    stubs.getPartById.restore()
    stubs.getBuildById.restore()
  })
  it('should resolve to 201', async () => {
    const result = await orderController.post(req)
    expect(result.status).to.equal(201)
  })
})

describe('order.transaction', () => {
  describe('create', () => {
    let stubs = {}
    let req = { params: { id: 'd3607fc8-442a-4394-a96e-042bd97f0624' } }
    beforeEach(async () => {
      stubs.getOrder = stub(db, 'getOrder').resolves([
        {
          status: 'Created',
          external_id: 'some-external-id',
          business_partner_code: 'some-business-partner-code',
          items: ['48d84d18-802e-4cb7-8997-f84dfc03b5a5'],
          id: '48d84d18-802e-4cb7-8997-f84dfc03b5a5',
          updated_at: new Date(),
        },
      ])
      stubs.insertOrderTransaction = stub(db, 'insertOrderTransaction').resolves({
        id: '48d84d18-802e-4cb7-8997-f84dfc03b5a5',
        status: 'Submitted',
        created_at: '2022-08-23T11:17:08.263Z',
      })
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
      stubs.updateOrderTransaction = stub(db, 'updateOrderTransaction').resolves([])
      stubs.updateOrder = stub(db, 'updateOrder').resolves([])
      stubs.getMemberBySelf = stub(identityService, 'getMemberBySelf').resolves('d3607fc8-442a-4394-a96e-042bd97f0624')
      stubs.getPartByIDs = stub(db, 'getPartByIDs').resolves([
        {
          id: '48d84d18-802e-4cb7-8997-f84dfc03b5a5',
          latest_token_id: 1,
        },
      ])
    })

    afterEach(async () => {
      stubs.getOrder.restore()
      stubs.insertOrderTransaction.restore()
      stubs.updateOrderTransaction.restore()
      stubs.updateOrder.restore()
      stubs.getMemberBySelf.restore()
      stubs.getPartByIDs.restore()
      nock.cleanAll()
    })
    it('should resolve 201', async () => {
      const result = await orderController.transaction.create('Submission')(req)
      expect(result.status).to.equal(201)
    })
  })
})
