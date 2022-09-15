const db = require('../../../db')
const identity = require('../../services/identityService')
const { NoTokenError, NothingToProcess, BadRequestError, NotFoundError } = require('../../../utils/errors')

exports.validate = async (body) => {
  // Will add a get function at a later date to check for duplication
  // This section checks if the order supplier does not match the supplier
  const uniqueRecipeIDs = [...new Set(body.items)]

  const recipes = await db.getRecipeByIDs(uniqueRecipeIDs)
  if (recipes.length != uniqueRecipeIDs.length) {
    throw new BadRequestError('recipe not found')
  } else {
    recipes.map((recipeItem) => {
      if (recipeItem.supplier != body.supplierAddress) {
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
    ...((type == 'Amendment' || type == 'Acknowledgement') && { requiredBy: req.body.requiredBy }),
    ...((type == 'Amendment' || type == 'Acknowledgement') && { price: req.body.price }),
    ...((type == 'Amendment' || type == 'Acknowledgement') && { items: req.body.items }),
    ...((type == 'Amendment' || type == 'Acknowledgement') && { quantity: req.body.quantity }),
    ...((type == 'Amendment' || type == 'Acknowledgement') && { forecastDate: req.body.forecastDate }),
    ...(type == 'Acknowledgement' && { imageAttachmentId: req.body.imageAttachmentId }),
    ...(type == 'Acknowledgement' && { comments: req.body.comments }),
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
    newItem['items'] = item['items']
    newItem['requiredBy'] = item['required_by'].toISOString()
    newItem['externalId'] = item['external_id']
    newItem['price'] = item['price']
    newItem['quantity'] = item['quantity']
    newItem['forecastDate'] = item['forecast_date'].toISOString()
    if (item['image_attachment_id']) {
      newItem['imageAttachmentId'] = item['image_attachment_id']
    }
    if (item['comments']) {
      newItem['comments'] = item['comments']
    }
    let parts = await db.getPartsByOrderId(item['id'])
    if (parts.length != 0) {
      newItem['partIds'] = parts.map((item) => {
        return item['id']
      })
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
  let results = null
  if (type == 'Acknowledgement' || type == 'Amendment') {
    results = await db.getOrder(id)
    if (results.length == 0) {
      throw new NotFoundError('order')
    }
  }
  const modifiedOrderTransactions = orderTransactions.map((item) => {
    const newItem = {}
    newItem['id'] = item['id']
    newItem['submittedAt'] = item['created_at'].toISOString()
    newItem['status'] = item['status']
    if (results) {
      newItem['items'] = results[0].items
      newItem['requiredBy'] = results[0].required_by.toISOString()
    }
    return newItem
  })
  return modifiedOrderTransactions
}

/*eslint-disable */
const buildRecipeOutputs = (data, recipes,parentIndexOffset,type) =>
  recipes.map((_, i) => ({
    roles: {
      Owner: data.buyer,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: { type: { type: 'LITERAL', value: 'RECIPE' } },
    parent_index: i + parentIndexOffset,
  }))

const buildOrderOutput = (data,type) => {
    return {
      roles: {
        Owner: (type == 'Acknowledgement') ? data.buyer : data.supplier,
        Buyer: data.buyer,
        Supplier: data.supplier,
      },
      metadata: {
        type: { type: 'LITERAL', value: 'ORDER' },
        status: { type: 'LITERAL', value: data.status },
        requiredBy: { type: 'LITERAL', value: data.required_by },
        transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
        externalId: { type: 'LITERAL', value: data.external_id },
        ...(type == 'Acknowledgement' && data.filename) && {image: {type: 'FILE', value: data.filename}},
        ...(type == 'Acknowledgement' && data.image_attachment_id) && {imageAttachmentId: {type: 'FILE', value: 'image_attachment_id.json'}},
        price: {type: 'LITERAL', value: data.price.toString()},
        quantity: {type: 'LITERAL', value: data.quantity.toString()},
        forecastDate: {type: 'LITERAL', value: data.forecast_date},
        ...(type == 'Acknowledgement' && data.comments) && {comments: {type: 'FILE', value: 'comments.json'}},
        recipes: { type: 'FILE', value: 'recipes.json'},
        id: { type : 'FILE', value: 'id.json'}
      },
      ...(type != 'Submission') && {parent_index: 0}
    }
}
/*eslint-enable */

exports.mapOrderData = async (data, type) => {
  if (!data.items || data.items.length < 1) throw new NothingToProcess()
  const records = await db.getRecipeByIDs(data.items)
  const tokenIds = records.map((el) => el.latest_token_id)
  const orderTokenId = []
  let parentIndexOffset = 0
  if (type != 'Submission') {
    orderTokenId.push(data.latest_token_id)
    parentIndexOffset = 1
  }
  if (!tokenIds.every(Boolean)) throw new NoTokenError('recipes')
  const inputs = type != 'Acceptance' && type != 'Acknowledgement' ? orderTokenId.concat(tokenIds) : orderTokenId
  const outputs =
    type != 'Acceptance' && type != 'Acknowledgement'
      ? [buildOrderOutput(data, type), ...buildRecipeOutputs(data, tokenIds, parentIndexOffset, type)]
      : [buildOrderOutput(data, type)]
  return {
    recipes: Buffer.from(JSON.stringify(data.items)),
    id: Buffer.from(JSON.stringify(data.id)),
    ...(type == 'Acknowledgement' &&
      data.image_attachment_id && { imageAttachmentId: Buffer.from(JSON.stringify(data.image_attachment_id)) }),
    ...(type == 'Acknowledgement' && data.binary_blob && { image: data.binary_blob }),
    ...(type == 'Acknowledgement' && data.comments && { comments: Buffer.from(JSON.stringify(data.comments)) }),
    inputs,
    outputs: outputs,
  }
}
