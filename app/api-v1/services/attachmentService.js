const fs = require('fs')
const { insertAttachment, getAttachmentByIdDb } = require('../../db')
const { HttpResponseError, NotFoundError } = require('../../utils/errors')

const createAttachmentFromFile = async (file) => {
  return new Promise((resolve) => {
    fs.readFile(file.path, async (err, data) => {
      if (err) throw new HttpResponseError({ code: 500, message: err.message })
      const attachment = await createAttachment(file.originalname, data)
      resolve(attachment)
    })
  })
}

const createAttachment = async (name, buffer) => {
  const attachment = await insertAttachment(name, buffer)
  return attachment
}

async function getAttachmentByID(id) {
  const [attachmentResult] = await getAttachmentByIdDb(id)
  if (!attachmentResult) {
    throw new NotFoundError({ message: 'Attachment not found' })
  } else return attachmentResult
}

module.exports = {
  createAttachment,
  createAttachmentFromFile,
  getAttachmentByID,
}
