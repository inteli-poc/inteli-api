const fs = require('fs')
const { insertAttachment } = require('../../db')
const { HttpResponseError } = require('../../utils/errors')

const createAttachment = async (file) => {
  return new Promise((resolve) => {
    fs.readFile(file.path, async (err, data) => {
      if (err) throw new HttpResponseError({ code: 500, message: err.message, service: 'attachment' })
      const attachment = await insertAttachment(file.originalname, data)
      resolve(attachment)
    })
  })
}

module.exports = {
  createAttachment,
}
