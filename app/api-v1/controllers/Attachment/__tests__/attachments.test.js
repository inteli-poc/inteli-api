const { expect } = require('chai')
const { stub } = require('sinon')

const attachment = require('../index')
const { BadRequestError, NotFoundError } = require('../../../../utils/errors')
const { jsonAttachment, fileAttachment, allAttachments } = require('../__tests__/attachments_fixtures')
const db = require('../../../../db')

const getAttachment = async (req) => {
  try {
    return await attachment.getById(req)
  } catch (err) {
    return err
  }
}

const getAttachments = async () => {
  try {
    return await attachment.get()
  } catch (err) {
    return err
  }
}

describe('Attachment controller', () => {
  let stubs = {}
  let response
  beforeEach(() => {
    stubs.insertAttachment = stub(db, 'insertAttachment').resolves({
      id: jsonAttachment.id,
      name: jsonAttachment.filename,
    })
    stubs.getAttachment = stub(db, 'getAttachment').resolves([])
    stubs.getAttachments = stub(db, 'getAttachments').resolves([])
  })

  afterEach(() => {
    stubs.getAttachment.restore()
    stubs.getAttachments.restore()
    stubs.insertAttachment.restore()
  })

  describe('/attachment/{id} - get by id endpoint', () => {
    describe('if req.params.id is not provided', () => {
      beforeEach(async () => {
        response = await getAttachment({ params: {} })
      })

      it('throws a validation error', async () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('Bad Request: missing params')
      })

      it('does not perform any database calls', () => {
        expect(stubs.getAttachment.calledOnce).to.equal(false)
      })
    })

    describe('if no attachments are found with a given ID', () => {
      beforeEach(async () => {
        response = await getAttachment({ params: { id: '1000000-2000-1000-8000-000000000000' } })
      })

      it('throws an error', () => {
        expect(response.code).to.be.equal(404)
        expect(response).to.be.an.instanceOf(NotFoundError)
        expect(response.message).to.be.equal('Not Found: Attachment Not Found')
      })
    })

    describe('happy path - file attachment', () => {
      beforeEach(async () => {
        stubs.getAttachment.resolves([fileAttachment])
        response = await getAttachment({
          params: { id: fileAttachment.id },
          headers: { accept: 'application/octet-stream' },
        })
      })

      it('returns a file attachment', () => {
        const { status, response: body, headers } = response
        expect(status).to.be.equal(200)
        expect(headers).to.deep.equal({
          'access-control-expose-headers': 'content-disposition',
          'content-disposition': 'attachment; filename="foo1.jpg"',
          'content-type': 'application/octet-stream',
          immutable: true,
          maxAge: 31536000000,
        })
        expect(body).to.deep.equal(fileAttachment.binary_blob)
      })
    })

    afterEach(() => {
      stubs.getAttachment.restore()
    })

    describe('happy path - json attachment', () => {
      beforeEach(async () => {
        stubs.getAttachment.resolves([jsonAttachment])
        response = await getAttachment({
          params: { id: jsonAttachment.id },
          headers: { accept: 'application/json' },
        })
      })

      afterEach(() => {
        stubs.getAttachment.restore()
      })

      it('returns a json attachment', () => {
        const { status, response: body } = response
        expect(status).to.be.equal(200)
        expect(body).to.deep.equal({ 'First Item': 'Test Data' })
      })
    })
  })

  describe('/attachment/ - get all endpoint', () => {
    beforeEach(() => {
      stubs.getAttachments.restore()
      stubs.getAttachments = stub(db, 'getAttachments').resolves([])
    })
    afterEach(() => {
      stubs.getAttachments.restore()
    })
    describe('if no attachments are found', () => {
      beforeEach(async () => {
        stubs.getAttachments.restore()
        stubs.getAttachments = stub(db, 'getAttachments').resolves([])
        response = await getAttachments()
      })
      it('performs a database call too check for attachments', () => {
        expect(stubs.getAttachments.calledOnce).to.equal(true)
      })

      it('throws an error', async () => {
        expect(response).to.be.an.instanceOf(NotFoundError)
        expect(response.message).to.be.equal('Not Found: Attachments Not Found')
      })
    })

    describe('attachments are found', () => {
      beforeEach(async () => {
        stubs.getAttachments.restore()
        stubs.getAttachments = stub(db, 'getAttachments').resolves([allAttachments])
        response = await getAttachments()
      })
      afterEach(() => {
        stubs.getAttachments.restore()
      })
      it('returns a 200 status', async () => {
        expect(response.status).to.be.equal(200)
      })

      it('resturns a list of attachments', async () => {
        expect(response.response).to.deep.equal([
          {
            id: '00000000-0000-1000-8000-000000000001',
            filename: 'foo1.jpg',
            size: '7',
          },
          {
            id: '00000000-0000-1000-9000-000000000001',
            filename: 'json',
            size: '35',
          },
        ])
      })
    })
  })
})
