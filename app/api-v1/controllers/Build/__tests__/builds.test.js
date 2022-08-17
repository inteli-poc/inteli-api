const { expect } = require('chai')
const buildController = require('../index')
const { stub } = require('sinon')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')

describe('build.getAll', () => {
  let stubs = {}
  beforeEach(async () => {
    stubs.getBuild = stub(db, 'getBuild').resolves([
      {
        supplier: 'some-supplier',
        completed_at: new Date(),
        started_at: new Date(),
        completion_estimated_at: new Date(),
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
        completion_estimated_at: new Date(),
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
  describe('getAll', () => {
    it('should resolve 500 error', async () => {
      const result = await buildController.transaction.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('get', () => {
    it('should resolve 500 error', async () => {
      const result = await buildController.transaction.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('create', () => {
    it('should resolve 500 error', async () => {
      const result = await buildController.transaction.create()
      expect(result.status).to.equal(500)
    })
  })
})
