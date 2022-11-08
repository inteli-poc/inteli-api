const db = require('../../../db')
const identity = require('../../services/identityService')
const { NoTokenError, NothingToProcess, BadRequestError, NotFoundError } = require('../../../utils/errors')
const { getMetadata } = require('../../../utils/dscp-api')
const partController = require('../Part/index')
const buildController = require('../Build/index')
exports.validate = async (body) => {
  // Will add a get function at a later date to check for duplication
  // This section checks if the order supplier does not match the supplier
  const uniquePartIDs = [...new Set(body.items)]

  const parts = await db.getPartByIDs(uniquePartIDs)
  if (parts.length != uniquePartIDs.length) {
    throw new BadRequestError('part not found')
  } else {
    parts.map((partItem) => {
      if (partItem.supplier != body.supplierAddress) {
        throw new BadRequestError('invalid supplier')
      }
    })
  }

  return body
}

exports.getBuildHistory = async (req, part) => {
  let buildObj = {}
  buildObj[part.build_id] = {}
  try {
    let buildScheduleResult = await buildController.transaction.getAll('Schedule')(req)
    buildObj[part.build_id].schedule = buildScheduleResult.response
  } catch (err) {
    buildObj[part.build_id].schedule = []
  }
  try {
    let buildStartResult = await buildController.transaction.getAll('Start')(req)
    buildObj[part.build_id].start = buildStartResult.response
  } catch (err) {
    buildObj[part.build_id].start = []
  }
  try {
    let buildProgressUpdateResult = await buildController.transaction.getAll('progress-update')(req)
    buildObj[part.build_id].progressUpdate = buildProgressUpdateResult.response
  } catch (err) {
    buildObj[part.build_id].progressUpdate = []
  }
  try {
    let buildCompleteResult = await buildController.transaction.getAll('Complete')(req)
    buildObj[part.build_id].complete = buildCompleteResult.response
  } catch (err) {
    buildObj[part.build_id].complete = []
  }
  return buildObj
}

exports.getPartHistory = async (part) => {
  let partObj = {}
  partObj[part.id] = {}
  try {
    let req = {}
    req.params = { id: part.id }
    let partMetadataUpdateResult = await partController.transaction.getAll('metadata-update')(req)
    partObj[part.id].metadataUpdate = partMetadataUpdateResult.response
  } catch (err) {
    partObj[part.id].metadataUpdate = []
  }
  try {
    let req = {}
    req.params = { id: part.id }
    let partCertificationResult = await partController.transaction.getAll('certification')(req)
    partObj[part.id].certification = partCertificationResult.response
  } catch (err) {
    partObj[part.id].certification = []
  }
  try {
    let req = {}
    req.params = { id: part.id }
    let partUpdateDeilveryDateResult = await partController.transaction.getAll('update-delivery-date')(req)
    partObj[part.id].updateDeliveryDate = partUpdateDeilveryDateResult.response
  } catch (err) {
    partObj[part.id].updateDeliveryDate = []
  }
  return partObj
}
exports.getResponse = async (type, transaction, req) => {
  return {
    id: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...((type == 'Amendment' || type == 'Acknowledgement') && { items: req.body.items }),
    ...(type == 'Acknowledgement' && req.body.imageAttachmentId && { imageAttachmentId: req.body.imageAttachmentId }),
    ...(type == 'Acknowledgement' && req.body.comments && { comments: req.body.comments }),
  }
}

exports.getResultForOrderGet = async (result, req) => {
  if (result.length == 0) {
    throw new NotFoundError('orders')
  }
  const promises = result.map(async (item) => {
    const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
    const { alias: buyerAlias } = await identity.getMemberByAddress(req, item.buyer)
    const newItem = {}
    newItem['buyer'] = buyerAlias
    newItem['supplier'] = supplierAlias
    newItem['id'] = item['id']
    newItem['status'] = item['status']
    let parts = []
    for (let partId of item['items']) {
      let partObj = {}
      partObj['partId'] = partId
      let [part] = await db.getPartById(partId)
      if (part) {
        if (part.forecast_delivery_date) {
          partObj['forecastedDeliveryDate'] = part.forecast_delivery_date.toISOString()
        }
        let [build] = await db.getBuildById(part.build_id)
        if (build) {
          partObj['buildStatus'] = build.status
          if (build.update_type) {
            partObj['updateType'] = build.update_type
          }
        }
      }
      parts.push(partObj)
    }
    newItem['parts'] = parts
    newItem['externalId'] = item['external_id']
    newItem['businessPartnerCode'] = item['business_partner_code']
    if (item['image_attachment_id']) {
      newItem['imageAttachmentId'] = item['image_attachment_id']
    }
    if (item['comments']) {
      newItem['comments'] = item['comments']
    }
    return newItem
  })
  const modifiedResult = []
  for await (let val of promises) {
    modifiedResult.push(val)
  }
  return {
    status: 200,
    response: modifiedResult,
  }
}

exports.getResultForOrderTransactionGet = async (orderTransactions, type, id) => {
  if (orderTransactions.length == 0) {
    throw new NotFoundError('order_transactions')
  }
  let order = await db.getOrder(id)
  if (order.length == 0) {
    throw new NotFoundError('order')
  }
  const modifiedOrderTransactions = await Promise.all(
    orderTransactions.map(async (item, index) => {
      const newItem = {}
      newItem['id'] = item['id']
      newItem['submittedAt'] = item['created_at'].toISOString()
      newItem['status'] = item['status']
      let comments
      let imageAttachmentId
      let updatedParts
      switch (type) {
        case 'Acknowledgement':
          try {
            comments = await getMetadata(item.token_id, 'comments')
            comments = comments.data
          } catch (err) {
            comments = null
          }
          try {
            imageAttachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
            imageAttachmentId = imageAttachmentId.data
          } catch (err) {
            imageAttachmentId = null
          }
          updatedParts = await getMetadata(item.token_id, 'updatedParts')
          updatedParts = updatedParts.data
          newItem['items'] = {}
          for (let partId of updatedParts) {
            let req = { params: { id: partId } }
            let partResponse = await partController.transaction.getAll('acknowledgement')(req)
            newItem['items'][partId] = partResponse.response[index]
          }
          newItem['comments'] = comments
          newItem['imageAttachmentId'] = imageAttachmentId
          break
        case 'Amendment':
          updatedParts = await getMetadata(item.token_id, 'updatedParts')
          updatedParts = updatedParts.data
          newItem['items'] = {}
          for (let partId of updatedParts) {
            let req = { params: { id: partId } }
            let partResponse = await partController.transaction.getAll('amendment')(req)
            newItem['items'][partId] = partResponse.response[index]
          }
          break
      }
      return newItem
    })
  )
  return modifiedOrderTransactions
}

const buildOrderOutput = (data, type) => {
  return {
    roles: {
      Owner: type == 'Acknowledgement' ? data.buyer : data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'ORDER' },
      status: { type: 'LITERAL', value: data.status },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
      externalId: { type: 'LITERAL', value: data.external_id },
      ...(type == 'Acknowledgement' && data.filename && { image: { type: 'FILE', value: data.filename } }),
      ...(type == 'Acknowledgement' &&
        data.image_attachment_id && { imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' } }),
      businessPartnerCode: { type: 'LITERAL', value: data.business_partner_code },
      ...(type == 'Acknowledgement' && data.comments && { comments: { type: 'FILE', value: 'comments.json' } }),
      parts: { type: 'FILE', value: 'parts.json' },
      id: { type: 'FILE', value: 'id.json' },
      actionType: { type: 'LITERAL', value: type },
      ...((type == 'Acknowledgement' || type == 'Amendment') && {
        updatedParts: { type: 'FILE', value: 'updated_parts.json' },
      }),
    },
    ...(type != 'Submission' && { parent_index: 0 }),
  }
}
/*eslint-enable */

exports.mapOrderData = async (data, type) => {
  if (!data.items || data.items.length < 1) throw new NothingToProcess()
  const records = await db.getPartByIDs(data.items)
  const tokenIds = records.map((el) => el.latest_token_id)
  const orderTokenId = []
  if (type != 'Submission') {
    orderTokenId.push(data.latest_token_id)
  }
  if (!tokenIds.every(Boolean)) throw new NoTokenError('parts')
  const inputs = orderTokenId
  const outputs = [buildOrderOutput(data, type)]
  return {
    parts: Buffer.from(JSON.stringify(data.items)),
    ...((type == 'Acknowledgement' || type == 'Amendment') && {
      updatedParts: Buffer.from(JSON.stringify(data.updatedParts)),
    }),
    id: Buffer.from(JSON.stringify(data.id)),
    ...(type == 'Acknowledgement' &&
      data.image_attachment_id && { imageAttachmentId: Buffer.from(JSON.stringify(data.image_attachment_id)) }),
    ...(type == 'Acknowledgement' && data.binary_blob && { image: data.binary_blob }),
    ...(type == 'Acknowledgement' && data.comments && { comments: Buffer.from(JSON.stringify(data.comments)) }),
    inputs,
    outputs: outputs,
  }
}
