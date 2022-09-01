const { expect } = require('chai')
const partController = require('../index')
const { stub } = require('sinon')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')

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
    it('should resolve 500 error', async () => {
      const result = await partController.transaction.create()
      expect(result.status).to.equal(500)
    })
  })
})
