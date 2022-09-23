const fs = require('fs')
const fsPromises = require('fs').promises
const { insertAttachment } = require('../../../db')
const { HttpResponseError, NotAcceptableError } = require('../../../utils/errors')

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

const createAttachmentFromFile = async (file) => {
  return new Promise((resolve) => {
    fs.readFile(file.path, async (err, data) => {
      if (err) throw new HttpResponseError({ code: 500, message: err.message })
      const attachment = await createAttachment(file.originalname, data)
      await fsPromises.unlink(file.path)
      resolve(attachment)
    })
  })
}

const checkMimeType = async (orderedAccept, attachment, type) => {
  if (type == 'json') {
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
}

const createAttachment = async (name, buffer) => {
  const attachment = await insertAttachment(name, buffer)
  return attachment
}

module.exports = {
  createAttachment,
  createAttachmentFromFile,
  checkMimeType,
}
