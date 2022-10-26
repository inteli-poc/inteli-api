const db = require('../../../db')
const identity = require('../../services/identityService')
const { NoTokenError, NothingToProcess, BadRequestError, NotFoundError } = require('../../../utils/errors')
const { getMetadata } = require('../../../utils/dscp-api')

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
    newItem['partIds'] = item['items']
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

const getCommonData = async (item, newItem) => {
  let price
  let quantity
  let confirmedReceiptDate
  price = await getMetadata(item.token_id, 'price')
  price = price.data
  quantity = await getMetadata(item.token_id, 'quantity')
  quantity = quantity.data
  confirmedReceiptDate = await getMetadata(item.token_id, 'confirmedReceiptDate')
  confirmedReceiptDate = confirmedReceiptDate.data
  newItem['price'] = price
  newItem['quantity'] = quantity
  newItem['confirmedReceiptDate'] = confirmedReceiptDate
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
    orderTransactions.map(async (item) => {
      const newItem = {}
      newItem['id'] = item['id']
      newItem['submittedAt'] = item['created_at'].toISOString()
      newItem['status'] = item['status']
      let comments
      let imageAttachmentId
      let recipes
      switch (type) {
        case 'Acknowledgement':
          await getCommonData(item, newItem)
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
          newItem['comments'] = comments
          newItem['imageAttachmentId'] = imageAttachmentId
          break
        case 'Amendment':
          await getCommonData(item, newItem)
          recipes = await getMetadata(item.token_id, 'recipes')
          recipes = recipes.data
          newItem['items'] = recipes
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
      ...((type == 'Acknowledgment' || type == 'Amendment') && {
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
