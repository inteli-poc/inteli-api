const { parseAccept } = require('../../../utils/parseAcceptHeader')
const logger = require('../../../utils/Logger')

const db = require('../../../db')

const { createAttachmentFromFile, createAttachment } = require('../Attachment/helpers')
const { NotFoundError, BadRequestError, NotAcceptableError } = require('../../../utils/errors')

const returnOctet = ({ filename, binary_blob }) => ({
  status: 200,
  headers: {
    immutable: true,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    'content-disposition': `attachment; filename="${filename}"`,
    'access-control-expose-headers': 'content-disposition',
    'content-type': 'application/octet-stream',
  },
  response: binary_blob,
})

module.exports = {
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
  getById: async function (req) {
    const { id } = req.params
    if (!id) throw new BadRequestError('missing params')

    const [attachment] = await db.getAttachment(req.params.id)
    if (!attachment) throw new NotFoundError('Attachment Not Found')
    const orderedAccept = parseAccept(req.headers.accept)

    if (attachment.filename === 'json') {
      for (const mimeType of orderedAccept) {
        if (mimeType === 'application/json' || mimeType === 'application/*' || mimeType === '*/*') {
          const json = JSON.parse(attachment.binary_blob)
          return { status: 200, response: json }
        }
        if (mimeType === 'application/octet-stream') {
          return returnOctet(attachment)
        }
      }
      throw new NotAcceptableError({ message: 'Client file request not supported' })
    }
    for (const mimeType of orderedAccept) {
      if (mimeType === 'application/octet-stream' || mimeType === 'application/*' || mimeType === '*/*') {
        return returnOctet(attachment)
      }
    }
    throw new NotAcceptableError({ message: 'Client file request not supported' })
  },
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
