const { expect } = require('chai')
const orderController = require('../index')

describe('order.getAll', () => {
  it('should resolve 500 error', async () => {
    const result = await orderController.getAll()
    expect(result.status).to.equal(500)
  })
})

describe('order.get', () => {
  it('should resolve 500 error', async () => {
    const result = await orderController.get()
    expect(result.status).to.equal(500)
  })
})

describe('order.transaction', () => {
  describe('getAll', () => {
    it('should resolve 500 error', async () => {
      const result = await orderController.transaction.getAll()
      expect(result.status).to.equal(500)
    })
  })

  describe('get', () => {
    it('should resolve 500 error', async () => {
      const result = await orderController.transaction.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('create', () => {
    it('should resolve 500 error', async () => {
      const result = await orderController.transaction.create()
      expect(result.status).to.equal(500)
    })
  })
})
