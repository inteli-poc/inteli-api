const { expect } = require('chai')
const buildController = require('../index')

describe('build.getAll', () => {
  it('should resolve 500 error', async () => {
    const result = await buildController.getAll()
    expect(result.status).to.equal(500)
  })
})

describe('build.get', () => {
  it('should resolve 500 error', async () => {
    const result = await buildController.get()
    expect(result.status).to.equal(500)
  })
})

describe('build.create', () => {
  it('should resolve 500 error', async () => {
    const result = await buildController.create()
    expect(result.status).to.equal(500)
  })
})

describe('build.transaction', () => {
  describe('getAll', () => {
    it('should resolve 500 error', async () => {
      const result = await buildController.transaction.getAll()
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
