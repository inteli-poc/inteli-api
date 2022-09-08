const fetch = require('node-fetch')
const FormData = require('form-data')

const { DSCP_API_PORT, DSCP_API_HOST } = require('../../env')

module.exports = {
  async runProcess({ recipes, comments, id, imageAttachmentId, image, requiredCerts, ...payload }, authToken) {
    const url = `http://${DSCP_API_HOST}:${DSCP_API_PORT}/v3/run-process`
    const formData = new FormData()

    formData.append('request', JSON.stringify(payload))
    if (requiredCerts) formData.append('file', requiredCerts, 'required_certs.json')
    if (image) formData.append('file', image, payload.outputs[0].metadata.image.value)
    if (id) formData.append('file', id, 'id.json')
    if (imageAttachmentId) formData.append('file', imageAttachmentId, 'image_attachment_id.json')
    if (comments) formData.append('file', comments, 'comments.json')
    if (recipes) formData.append('file', recipes, 'recipes.json')
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    })

    return res.json()
  },
}
