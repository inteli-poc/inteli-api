const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError } = require('../../../utils/errors')
const { getMetadata } = require('../../../utils/dscp-api')

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
    id: req.params.id,
    transactionId: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...(type != 'Complete' && { completionEstimate: req.body.completionEstimate }),
    ...(type == 'Start' && { startedAt: req.body.startedAt }),
    ...((type == 'progress-update' || type == 'Complete') && { attachmentId: req.body.attachmentId }),
    ...(type == 'Complete' && { completedAt: req.body.completedAt }),
    ...(type == 'progress-update' && { updateType: req.body.updateType }),
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
      if (item.started_at) {
        newItem.startedAt = item.started_at.toISOString()
      }
      if (item.completed_at) {
        newItem.completedAt = item.completed_at.toISOString()
      }
      if (item.update_type && item.update_type != '3-Way Match Completed') {
        newItem.updateType = item.update_type
      }
      return newItem
    })
  )
  return result
}

exports.getResultForBuildTransactionGet = async (buildTransactions, type, id) => {
  if (buildTransactions.length == 0) {
    throw new NotFoundError('build_transactions')
  }
  let build = await db.getBuildById(id)
  if (build.length == 0) {
    throw new NotFoundError('build')
  }
  const modifiedBuildTransactions = await Promise.all(
    buildTransactions.map(async (item) => {
      let completionEstimate
      let attachmentId
      let startedAt
      let completedAt
      let updateType
      let newItem = {}
      newItem['transactionId'] = item['id']
      newItem['id'] = item['build_id']
      newItem['status'] = item['status']
      newItem['submittedAt'] = item['created_at'].toISOString()
      switch (type) {
        case 'Start':
          startedAt = await getMetadata(item.token_id, 'startedAt')
          startedAt = startedAt.data
          completionEstimate = await getMetadata(item.token_id, 'completionEstimate')
          completionEstimate = completionEstimate.data
          newItem['startedAt'] = startedAt
          newItem['completionEstimate'] = completionEstimate
          break
        case 'Schedule':
          completionEstimate = await getMetadata(item.token_id, 'completionEstimate')
          completionEstimate = completionEstimate.data
          newItem['completionEstimate'] = completionEstimate
          break
        case 'progress-update':
          try {
            attachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
            attachmentId = attachmentId.data
          } catch (err) {
            attachmentId = null
          }
          completionEstimate = await getMetadata(item.token_id, 'completionEstimate')
          completionEstimate = completionEstimate.data
          updateType = await getMetadata(item.token_id, 'updateType')
          updateType = updateType.data
          if (attachmentId) {
            newItem['attachmentId'] = attachmentId
          }
          newItem['completionEstimate'] = completionEstimate
          newItem['updateType'] = updateType
          break
        case 'Complete':
          attachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
          attachmentId = attachmentId.data
          completedAt = await getMetadata(item.token_id, 'completedAt')
          completedAt = completedAt.data
          newItem['attachmentId'] = attachmentId
          newItem['completedAt'] = completedAt
          break
      }
      return newItem
    })
  )
  return modifiedBuildTransactions
}
const buildBuildOutputs = (data, type) => {
  return {
    roles: {
      Owner: type != 'Complete' && data.update_type != '3-Way Match Completed' ? data.supplier : data.buyer,
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
      ...((type == 'Complete' || type == 'progress-update') &&
        data.filename && { image: { type: 'FILE', value: data.filename } }),
      ...((type == 'Complete' || type == 'progress-update') &&
        data.attachment_id && {
          imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' },
        }),
      parts: { type: 'FILE', value: 'parts.json' },
      id: { type: 'FILE', value: 'id.json' },
      actionType: { type: 'LITERAL', value: type },
      ...(type == 'progress-update' && { updateType: { type: 'LITERAL', value: data.update_type } }),
    },
    ...(type != 'Schedule' && { parent_index: 0 }),
  }
}

exports.mapBuildData = async (data, type) => {
  let inputs
  let outputs
  if (type == 'Schedule') {
    inputs = []
  } else {
    inputs = [data.latest_token_id]
  }
  outputs = [buildBuildOutputs(data, type)]
  return {
    parts: Buffer.from(JSON.stringify(data.partIds)),
    id: Buffer.from(JSON.stringify(data.id)),
    ...((type == 'progress-update' || type == 'Complete') &&
      data.attachment_id && {
        imageAttachmentId: Buffer.from(JSON.stringify(data.attachment_id)),
      }),
    ...((type == 'progress-update' || type == 'Complete') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
