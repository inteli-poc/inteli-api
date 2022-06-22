const fs = require('fs')
const { insertAttachment } = require('../../../db')
const { HttpResponseError } = require('../../../utils/errors')

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

module.exports = {
  createAttachment,
  createAttachmentFromFile,
}
