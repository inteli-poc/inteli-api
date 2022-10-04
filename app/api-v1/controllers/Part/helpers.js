const db = require('../../../db')
const identity = require('../../services/identityService')
const { NotFoundError, InternalError } = require('../../../utils/errors')
const { getMetadata } = require('../../../utils/dscp-api')

const buildPartOutputs = (data, type, parent_index_required) => {
  return {
    roles: {
      Owner: data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'PART' },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
      ...(type == 'order-assignment' && { orderId: { type: 'FILE', value: 'order_id.json' } }),
      ...(type == 'order-assignment' && { itemIndex: { type: 'LITERAL', value: JSON.stringify(data.itemIndex) } }),
      ...((type == 'metadata-update' || type == 'certification') && { image: { type: 'FILE', value: data.filename } }),
      ...(type == 'metadata-update' && { metaDataType: { type: 'LITERAL', value: data.metadataType } }),
      ...((type == 'metadata-update' || type == 'certification') && {
        imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' },
      }),
      ...(type == 'certification' && {
        certificationIndex: { type: 'LITERAL', value: JSON.stringify(data.certificationIndex) },
      }),
      actionType: { type: 'LITERAL', value: type },
      id: { type: 'FILE', value: 'id.json' },
    },
    ...(parent_index_required && { parent_index: 0 }),
  }
}

exports.getResponse = async (type, transaction, req) => {
  return {
    id: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...(type == 'metadata-update' && { metadataType: req.body.metadataType }),
    ...((type == 'metadata-update' || type == 'certification') && { attachmentId: req.body.attachmentId }),
    ...(type == 'certification' && { certificationIndex: req.body.certificationIndex }),
    ...(type == 'order-assignment' && { orderId: req.body.orderId }),
    ...(type == 'order-assignment' && { itemIndex: req.body.itemIndex }),
  }
}

exports.getResultForPartGet = async (parts, req) => {
  if (parts.length == 0) {
    throw new NotFoundError('parts')
  }
  const result = await Promise.all(
    parts.map(async (item) => {
      const newItem = {}
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      newItem['supplier'] = supplierAlias
      newItem['buildId'] = item.build_id
      newItem['recipeId'] = item.recipe_id
      newItem['id'] = item.id
      newItem['certifications'] = item.certifications
      newItem['metadata'] = item.metadata
      return newItem
    })
  )
  return { status: 200, response: result }
}

exports.insertCertificationIntoPart = async (part, certificationIndex, attachmentId) => {
  if (!part.certifications) {
    throw new NotFoundError('part certifications')
  }
  if (certificationIndex > part.certifications.length) {
    throw new InternalError({ message: 'certification index out of range' })
  }
  for (let index = 0; index <= part.certifications.length; index++) {
    if (index == certificationIndex) {
      part.certifications[index].certificationAttachmentId = attachmentId
    }
  }
}

exports.checkAttachment = async (attachment) => {
  if (attachment.length == 0) {
    throw new NotFoundError('attachment')
  }
}

exports.getResultForPartTransactionGet = async (partTransanctions, type, id) => {
  if (partTransanctions.length == 0) {
    throw new NotFoundError('part_transactions')
  }
  let [part] = await db.getPartById(id)
  if (!part) {
    throw new NotFoundError('part')
  }
  const modifiedPartTransactions = await Promise.all(
    partTransanctions.map(async (item) => {
      let attachmentId
      let metadataType
      let orderId
      let itemIndex
      let certificationIndex
      const newItem = {}
      newItem['id'] = item['id']
      newItem['submittedAt'] = item['created_at'].toISOString()
      newItem['status'] = item['status']
      switch (type) {
        case 'metadata-update':
          metadataType = await getMetadata(item.token_id, 'metaDataType')
          metadataType = metadataType.data
          attachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
          attachmentId = attachmentId.data
          newItem['metadataType'] = metadataType
          newItem['attachmentId'] = attachmentId
          break
        case 'order-assignment':
          if (!part.order_id) {
            throw new NotFoundError('order')
          }
          orderId = await getMetadata(item.token_id, 'orderId')
          orderId = orderId.data
          itemIndex = await getMetadata(item.token_id, 'itemIndex')
          itemIndex = itemIndex.data
          newItem['orderId'] = orderId
          newItem['itemIndex'] = itemIndex
          break
        case 'certification':
          certificationIndex = await getMetadata(item.token_id, 'certificationIndex')
          certificationIndex = certificationIndex.data
          attachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
          attachmentId = attachmentId.data
          newItem['certificationIndex'] = certificationIndex
          newItem['attachmentId'] = attachmentId
          break
      }
      return newItem
    })
  )
  return modifiedPartTransactions
}
exports.mapPartData = async (data, type) => {
  let inputs
  let outputs
  let parent_index_required = false
  if (data.latest_token_id) {
    inputs = [data.latest_token_id]
    parent_index_required = true
  } else {
    inputs = []
  }
  outputs = [buildPartOutputs(data, type, parent_index_required)]
  return {
    id: Buffer.from(JSON.stringify(data.id)),
    ...((type == 'metadata-update' || type == 'certification') && {
      imageAttachmentId: Buffer.from(JSON.stringify(data.imageAttachmentId)),
    }),
    ...(type == 'order-assignment' && { orderId: Buffer.from(JSON.stringify(data.order_id)) }),
    ...((type == 'metadata-update' || type == 'certification') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
