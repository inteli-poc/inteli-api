const { expect } = require('chai')
const buildController = require('../index')
const { stub } = require('sinon')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')
const nock = require('nock')
const { DSCP_API_HOST, DSCP_API_PORT } = require('../../../../env')
const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`

describe('build.getAll', () => {
  let stubs = {}
  beforeEach(async () => {
    stubs.getBuild = stub(db, 'getBuild').resolves([
      {
        supplier: 'some-supplier',
        completed_at: new Date(),
        started_at: new Date(),
        completion_estimate: new Date(),
        external_id: 'some-external-id',
      },
    ])
    stubs.getPartIdsByBuildId = stub(db, 'getPartIdsByBuildId').resolves([
      {
        id: '50000000-0000-1000-5500-000000000001',
      },
    ])
    stubs.identityByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'supplier-alias' })
  })
  afterEach(async () => {
    stubs.getBuild.restore()
    stubs.identityByAddress.restore()
    stubs.getPartIdsByBuildId.restore()
  })
  it('should resolve to 200', async () => {
    const result = await buildController.getAll()
    expect(result.status).to.equal(200)
  })
})

describe('build.getById', () => {
  let stubs = {}
  let req = {}
  req.params = { id: '00000000-0000-1000-3000-000000000001' }
  beforeEach(async () => {
    stubs.getBuildById = stub(db, 'getBuildById').resolves([
      {
        supplier: 'some-supplier',
        completed_at: new Date(),
        started_at: new Date(),
        completion_estimate: new Date(),
        external_id: 'some-external-id',
      },
    ])
    stubs.getPartIdsByBuildId = stub(db, 'getPartIdsByBuildId').resolves([
      {
        id: '50000000-0000-1000-5500-000000000001',
      },
    ])
    stubs.identityByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'supplier-alias' })
  })
  afterEach(async () => {
    stubs.getBuildById.restore()
    stubs.identityByAddress.restore()
    stubs.getPartIdsByBuildId.restore()
    req = {}
  })
  it('should resolve to 200', async () => {
    const result = await buildController.getById(req)
    expect(result.status).to.equal(200)
  })
})

describe('build.create', () => {
  let stubs = {}
  let req = {}
  req.body = {
    externalId: 'some-external-system-id',
    parts: [
      {
        recipeId: '95a81bd1-6caf-49ed-b077-5fcb651b2625',
      },
    ],
    completionEstimate: new Date(),
  }
  beforeEach(async () => {
    stubs.identityByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'self-address' })
    stubs.identityBySelf = stub(identityService, 'getMemberBySelf').resolves(
      '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y'
    )
    stubs.getRecipeByIDs = stub(db, 'getRecipeByIDs').resolves([
      {
        supplier: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
      },
    ])
    stubs.postBuildDb = stub(db, 'postBuildDb').resolves([
      {
        id: '7989218f-fdc3-4f4c-a772-bae5f9e06994',
      },
    ])
    stubs.postPartDb = stub(db, 'postPartDb').resolves([
      {
        id: 'db37f6e4-c447-4dcb-90e4-f97bf949a492',
      },
    ])
  })
  afterEach(async () => {
    stubs.postBuildDb.restore()
    stubs.postPartDb.restore()
    stubs.getRecipeByIDs.restore()
    stubs.identityByAddress.restore()
    stubs.identityBySelf.restore()
  })
  it('should resolve to 201', async () => {
    const result = await buildController.create(req)
    expect(result.status).to.equal(201)
  })
})

describe('build.transaction', () => {
  let stubs = {}
  let req = { params: { id: '00000000-0000-1000-3000-000000000001' } }
  describe('getAll', () => {
    beforeEach(async () => {
      stubs.getBuildTransactions = stub(db, 'getBuildTransactions').resolves([
        {
          id: '00000000-0000-1000-3000-000000000001',
          status: 'Submitted',
          created_at: new Date(),
        },
      ])
      stubs.getBuildById = stub(db, 'getBuildById').resolves([
        {
          completion_estimate: new Date(),
        },
      ])
    })
    afterEach(async () => {
      req = {}
      stubs.getBuildTransactions.restore()
      stubs.getBuildById.restore()
    })
    it('should resolve 200', async () => {
      const result = await buildController.transaction.getAll('Schedule')(req)
      expect(result.status).to.equal(200)
    })
  })

  describe('get', () => {
    let stubs = {}
    let req = {
      params: { id: '00000000-0000-1000-3000-000000000001', scheduleId: '00000000-0000-1000-3000-000000000002' },
    }
    describe('getAll', () => {
      beforeEach(async () => {
        stubs.getBuildTransactionsById = stub(db, 'getBuildTransactionsById').resolves([
          {
            id: '00000000-0000-1000-3000-000000000001',
            status: 'Submitted',
            created_at: new Date(),
          },
        ])
        stubs.getBuildById = stub(db, 'getBuildById').resolves([
          {
            completion_estimate: new Date(),
          },
        ])
      })
      afterEach(async () => {
        req = {}
        stubs.getBuildTransactionsById.restore()
        stubs.getBuildById.restore()
      })
      it('should resolve 200', async () => {
        const result = await buildController.transaction.get('Schedule')(req)
        expect(result.status).to.equal(200)
      })
    })
  })

  describe('create', () => {
    let stubs = {}
    let req = {
      params: { id: '00000000-0000-1000-3000-000000000001' },
      body: { completionEstimate: new Date().toISOString() },
    }
    beforeEach(async () => {
      stubs.getBuildById = stub(db, 'getBuildById').resolves([
        {
          id: '70ce5b83-6cb6-4b62-871a-b637fe3aa9b4',
          external_id: 'some-external-system-id',
          supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          status: 'Created',
          completion_estimate: '2022-08-22T12:09:59.323Z',
          started_at: null,
          completed_at: null,
          created_at: '2022-08-23T11:07:41.409Z',
          updated_at: '2022-08-23T11:07:41.409Z',
          latest_token_id: null,
          original_token_id: null,
        },
      ])
      stubs.getPartIdsByBuildId = stub(db, 'getPartsByBuildId').resolves([
        {
          id: '3f29e398-489c-4e3e-aa79-1911099054c5',
          recipe_id: '27bb8d4b-f576-4aef-8102-e66fe296db11',
          build_id: '70ce5b83-6cb6-4b62-871a-b637fe3aa9b4',
          supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          certifications: null,
          created_at: '2022-08-23T11:07:41.432Z',
          updated_at: '2022-08-23T11:07:41.432Z',
        },
      ])
      stubs.getRecipeByIDs = stub(db, 'getRecipeByIDs').resolves([
        {
          id: '27bb8d4b-f576-4aef-8102-e66fe296db11',
          created_at: '2022-08-22T17:00:27.181Z',
          updated_at: '2022-08-22T17:00:27.181Z',
          external_id: 'another-external-system-id',
          name: 'Low-pressure compressor',
          image_attachment_id: '820caf18-3b04-447c-898c-9214521235df',
          material: 'Aluminium',
          alloy: 'Ti-6Al-4V',
          price: '1200',
          required_certs: [
            {
              description: 'tensionTest',
            },
          ],
          supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          owner: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
          latest_token_id: 1,
          original_token_id: 1,
        },
      ])
      stubs.insertBuildTransaction = stub(db, 'insertBuildTransaction').resolves({
        id: '48d84d18-802e-4cb7-8997-f84dfc03b5a5',
        status: 'Submitted',
        created_at: '2022-08-23T11:17:08.263Z',
      })
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
      stubs.updateBuildTransaction = stub(db, 'updateBuildTransaction').resolves([])
      stubs.updateBuild = stub(db, 'updateBuild').resolves([])
    })
    afterEach(async () => {
      stubs.getBuildById.restore()
      stubs.getPartIdsByBuildId.restore()
      stubs.getRecipeByIDs.restore()
      stubs.insertBuildTransaction.restore()
      stubs.updateBuildTransaction.restore()
      stubs.updateBuild.restore()
      nock.cleanAll()
      req = {}
    })
    it('should resolve 201', async () => {
      const result = await buildController.transaction.create('Schedule')(req)
      expect(result.status).to.equal(201)
    })
  })
})
