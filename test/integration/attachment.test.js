const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { postAttachment, postAttachmentNoFile } = require('../helper/routeHelper')
const { FILE_UPLOAD_SIZE_LIMIT_BYTES } = require('../../app/env')

describe('attachments', function () {
  describe('valid file upload', function () {
    let app

    before(async function () {
      app = await createHttpServer()
    })

    it('should return 201 - file uploaded', async function () {
      const size = 100
      const filename = 'test.pdf'
      const response = await postAttachment(app, Buffer.from('a'.repeat(size)), filename)

      expect(response.status).to.equal(201)
      expect(response.body).to.have.property('id')
      expect(response.body.filename).to.equal(filename)
      expect(response.body.size).to.equal(size)
    })
  })

  describe('invalid file upload', function () {
    let app

    before(async function () {
      app = await createHttpServer()
    })

    it('should return 400 - over file size limit', async function () {
      const response = await postAttachment(app, Buffer.alloc(FILE_UPLOAD_SIZE_LIMIT_BYTES + 1), 'tooLarge.pdf')

      expect(response.status).to.equal(400)
      expect(response.error.text).to.equal('File too large')
    })

    it('should return 400 - no file', async function () {
      const response = await postAttachmentNoFile(app)
      expect(response.status).to.equal(400)
      expect(response.error.text).to.equal('No file uploaded')
    })
  })
})
