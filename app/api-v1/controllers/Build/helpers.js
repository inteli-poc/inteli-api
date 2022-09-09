const db = require('../../../db')
const { BadRequestError } = require('../../../utils/errors')

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
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
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
