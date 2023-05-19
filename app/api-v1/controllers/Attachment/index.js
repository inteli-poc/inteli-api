const { parseAccept } = require('../../../utils/parseAcceptHeader')
const logger = require('../../../utils/Logger')

const db = require('../../../db')

const { createAttachmentFromFile, createAttachment, checkMimeType } = require('../Attachment/helpers')
const { NotFoundError, BadRequestError } = require('../../../utils/errors')

module.exports = {
  // this function returns all attachment in db
  get: async function () {
    const attachments = await db.getAttachments()
    if (attachments.length == 0) {
      throw new NotFoundError('attachments')
    }
    const res = attachments.map((item) => {
      return {
        id: item.id,
        filename: item.filename,
        size: item.binary_blob.length,
      }
    })
    return {
      status: 200,
      response: res,
    }
  },
  // this function return a attachment by id
  getById: async function (req) {
    const { id } = req.params
    if (!id) throw new BadRequestError('missing params')

    const [attachment] = await db.getAttachment(req.params.id)
    if (!attachment) throw new NotFoundError('Attachment Not Found')
    const orderedAccept = parseAccept(req.headers.accept)
    let type
    if (attachment.filename === 'json') {
      type = 'json'
      const result = await checkMimeType(orderedAccept, attachment, type)
      return result
    }
    type = 'octet'
    const result = await checkMimeType(orderedAccept, attachment, type)
    return result
  },
  // this function creates a attachment in db
  create: async (req) => {
    if (req.headers['content-type'] === 'application/json') {
      logger.info('JSON attachment upload: %j', req.body)
      const buffer = Buffer.from(JSON.stringify(req.body))
      const [result] = await createAttachment('json', buffer)
      return {
        status: 201,
        response: { ...result, size: buffer.length },
      }
    }

    logger.info('File attachment upload: %s', req.file)

    if (!req.file) {
      throw new BadRequestError('No file uploaded')
    }

    const [result] = await createAttachmentFromFile(req.file)
    return {
      status: 201,
      response: { ...result, size: req.file.size },
    }
  },
}
