const fetch = require('node-fetch')
const FormData = require('form-data')
const axios = require('axios')
const { DSCP_API_PORT, DSCP_API_HOST } = require('../../env')

module.exports = {
  async runProcess(
    {
      updatedParts,
      recipeId,
      parts,
      comments,
      id,
      imageAttachmentId,
      image,
      requiredCerts,
      lineText,
      deliveryAddress,
      partId,
      idPart,
      certificationType,
      ...payload
    },
    authToken
  ) {
    const url = `http://${DSCP_API_HOST}:${DSCP_API_PORT}/v3/run-process`
    const formData = new FormData()

    formData.append('request', JSON.stringify(payload))
    if (requiredCerts) formData.append('file', requiredCerts, 'required_certs.json')
    if (image) formData.append('file', image, payload.outputs[0].metadata.image.value)
    if (id) formData.append('file', id, 'id.json')
    if (imageAttachmentId) formData.append('file', imageAttachmentId, 'image_attachment_id.json')
    if (comments) formData.append('file', comments, 'comments.json')
    if (parts) formData.append('file', parts, 'parts.json')
    if (recipeId) formData.append('file', recipeId, 'recipe_id.json')
    if (updatedParts) formData.append('file', updatedParts, 'updated_parts.json')
    if (lineText) formData.append('file', lineText, 'line_text.json')
    if (deliveryAddress) formData.append('file', deliveryAddress, 'delivery_address.json')
    if (partId) formData.append('file', partId, 'partId.json')
    if (idPart) formData.append('file', idPart, 'idPart.json')
    if (certificationType) formData.append('file', certificationType, 'certification_type.json')
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    })

    return res.json()
  },

  async getMetadata(tokenID, metadata) {
    const url = `http://${DSCP_API_HOST}:${DSCP_API_PORT}/v3/item/${tokenID}/metadata/${metadata}`
    if (metadata == 'image') {
      return axios(url, {
        method: 'GET',
        responseType: 'arraybuffer',
      })
    } else {
      return axios(url, {
        method: 'GET',
      })
    }
  },
}
