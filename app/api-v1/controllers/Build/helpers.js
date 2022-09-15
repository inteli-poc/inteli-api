const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError } = require('../../../utils/errors')

exports.validate = async (items, supplier) => {
  const uniqueRecipeIDs = [...new Set(items)]

  const recipes = await db.getRecipeByIDs(uniqueRecipeIDs)
  if (recipes.length != uniqueRecipeIDs.length) {
    throw new BadRequestError('recipe not found')
  } else {
    recipes.map((recipeItem) => {
      if (recipeItem.supplier != supplier) {
        throw new BadRequestError('invalid supplier')
      }
    })
  }
}

exports.getResponse = async (type, transaction, req) => {
  return {
    id: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...(type != 'Complete' && { completionEstimate: req.body.completionEstimate }),
    ...(type == 'Start' && { startedAt: req.body.startedAt }),
    ...((type == 'progress-update' || type == 'Complete') && { attachmentId: req.body.attachmentId }),
    ...(type == 'Complete' && { completedAt: req.body.completedAt }),
  }
}

exports.getResultForBuildGet = async (build, req) => {
  if (build.length == 0) {
    throw new NotFoundError('build')
  }
  const result = await Promise.all(
    build.map(async (item) => {
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      const newItem = {}
      newItem.supplier = supplierAlias
      newItem.status = item.status
      newItem.id = item.id
      newItem.externalId = item.external_id
      const partIds = await db.getPartIdsByBuildId(item.id)
      newItem.partIds = partIds.map((item) => {
        return item.id
      })
      newItem.completionEstimate = item.completion_estimate.toISOString()
      newItem.startedAt = item.started_at ? item.started_at.toISOString() : item.started_at
      newItem.completedAt = item.completed_at ? item.completed_at.toISOString() : item.completed_at
      newItem.attachmentId = item.attachment_id
      return newItem
    })
  )
  return { status: 200, response: result }
}

exports.getResultForBuildTransactionGet = async (buildTransactions, type, id) => {
  if (buildTransactions.length == 0) {
    throw new NotFoundError('build_transactions')
  }
  let build = await db.getBuildById(id)
  if (build.length == 0) {
    throw new NotFoundError('build')
  }
  const modifiedBuildTransactions = buildTransactions.map((item) => {
    let newItem = {}
    newItem['id'] = item['id']
    newItem['status'] = item['status']
    newItem['submittedAt'] = item['created_at'].toISOString()
    switch (type) {
      case 'Start':
        newItem['startedAt'] = build[0].started_at.toISOString()
        newItem['completionEstimate'] = build[0].completion_estimate.toISOString()
        break
      case 'progress-update':
        newItem['attachmentId'] = build[0].attachment_id
        newItem['completionEstimate'] = build[0].completion_estimate.toISOString()
        break
      case 'Complete':
        newItem['attachmentId'] = build[0].attachment_id
        newItem['completedAt'] = build[0].completed_at.toISOString()
        break
    }
    return newItem
  })
  return modifiedBuildTransactions
}
const buildBuildOutputs = (data, type) => {
  return {
    roles: {
      Owner: data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'BUILD' },
      status: { type: 'LITERAL', value: data.status },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
      externalId: { type: 'LITERAL', value: data.external_id },
      ...(type != 'Complete' && { completionEstimate: { type: 'LITERAL', value: data.completion_estimate } }),
      ...(type == 'Start' && { startedAt: { type: 'LITERAL', value: data.started_at } }),
      ...(type == 'Complete' && { completedAt: { type: 'LITERAL', value: data.completed_at } }),
      ...((type == 'Complete' || type == 'progress-update') && { image: { type: 'FILE', value: data.filename } }),
      ...((type == 'Complete' || type == 'progress-update') && {
        imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' },
      }),
      partRecipeMap: { type: 'FILE', value: 'part_recipe.json' },
      id: { type: 'FILE', value: 'id.json' },
    },
    ...(type != 'Schedule' && { parent_index: 0 }),
  }
}

exports.mapOrderData = async (data, type) => {
  let inputs
  let outputs
  if (type == 'Schedule') {
    inputs = []
  } else {
    inputs = [data.latest_token_id]
  }
  outputs = [buildBuildOutputs(data, type)]
  return {
    partRecipeMap: Buffer.from(JSON.stringify(data.parts_to_recipe)),
    id: Buffer.from(JSON.stringify(data.id)),
    ...((type == 'progress-update' || type == 'Complete') && {
      imageAttachmentId: Buffer.from(JSON.stringify(data.attachment_id)),
    }),
    ...((type == 'progress-update' || type == 'Complete') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
