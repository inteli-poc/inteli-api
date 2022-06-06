const { expect } = require('chai')
const attachmentController = require('../index')

describe('attachment.getAll', () => {
  it('should resolve 500 error', async () => {
    const result = await attachmentController.getAll()
    expect(result.status).to.equal(500)
  })
})
