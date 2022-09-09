const { expect } = require('chai')
const partController = require('../index')
const { stub } = require('sinon')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')
const { DSCP_API_HOST, DSCP_API_PORT } = require('../../../../env')
const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`
const nock = require('nock')

describe('part.getAll', () => {
  let stubs = {}
  beforeEach(async () => {
    stubs.getParts = stub(db, 'getParts').resolves([
      {
        supplier: 'some-supplier',
        certifications: [{ description: 'tensiontest' }],
        build_id: '50000000-0000-1000-5500-000000000001',
        recipe_id: '50000000-0000-1000-5500-000000000002',
        id: '50000000-0000-1000-5500-000000000003',
      },
    ])
    stubs.identityByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'supplier-alias' })
  })
  afterEach(async () => {
    stubs.getParts.restore()
    stubs.identityByAddress.restore()
  })
  it('should resolve 200', async () => {
    const result = await partController.getAll()
    expect(result.status).to.equal(200)
  })
})

describe('part.get', () => {
  it('should resolve 500 error', async () => {
    const result = await partController.get()
    expect(result.status).to.equal(500)
  })
})

describe('part.transaction', () => {
  describe('getAll', () => {
    it('should resolve 500 error', async () => {
      const result = await partController.transaction.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('get', () => {
    it('should resolve 500 error', async () => {
      const result = await partController.transaction.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('create', () => {
    let stubs = {}
    let req = {
      params: { id: '00000000-0000-1000-3000-000000000001' },
      body: { metadataType: 'location', attachmentId: 'ba7a8e74-f553-407c-9de9-0aefdcd5ac6d' },
    }
    beforeEach(async () => {
      stubs.getPartById = stub(db, 'getPartById').resolves([
        {
          supplier: 'some-supplier',
          certifications: [{ description: 'tensiontest' }],
          build_id: '50000000-0000-1000-5500-000000000001',
          recipe_id: '50000000-0000-1000-5500-000000000002',
          id: '50000000-0000-1000-5500-000000000003',
        },
      ])
      stubs.getRecipeByIDdb = stub(db, 'getRecipeByIDdb').resolves([
        {
          latest_token_id: 1,
          supplier: 'some-supplier',
          owner: 'some-owner',
        },
      ])
      stubs.insertPartTransaction = stub(db, 'insertPartTransaction').resolves({
        id: '48d84d18-802e-4cb7-8997-f84dfc03b5a5',
        status: 'Submitted',
        created_at: '2022-08-23T11:17:08.263Z',
      })
      stubs.updatePartTransaction = stub(db, 'updatePartTransaction').resolves([])
      stubs.updatePart = stub(db, 'updatePart').resolves([])
      stubs.getAttachment = stub(db, 'getAttachment').resolves([
        {
          filename: 'test',
        },
      ])
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
    })
    afterEach(async () => {
      stubs.updatePart.restore()
      stubs.updatePartTransaction.restore()
      stubs.insertPartTransaction.restore()
      stubs.getRecipeByIDdb.restore()
      stubs.getPartById.restore()
      stubs.getAttachment.restore()
      nock.cleanAll()
      req = {}
    })
    it('should resolve 201', async () => {
      const result = await partController.transaction.create('metadata-update')(req)
      expect(result.status).to.equal(201)
    })
  })
})
