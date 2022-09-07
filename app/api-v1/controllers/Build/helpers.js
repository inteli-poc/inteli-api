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

const buildBuildOutputs = (data, parts_to_recipe, type) => {
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
        imageAttachmentId: { type: 'LITERAL', value: data.attachment_id },
      }),
      ...parts_to_recipe,
      id: { type: 'LITERAL', value: data.id },
    },
    ...(type != 'Schedule' && { parent_index: 0 }),
  }
}

exports.mapOrderData = async (data, type) => {
  let inputs
  let outputs
  const parts_to_recipe = data.parts_to_recipe.reduce((output, id, index) => {
    if (id) {
      output['part_recipe_' + index] = {
        type: 'LITERAL',
        value: JSON.stringify(id),
      }
    }

    return output
  }, {})
  if (type == 'Schedule') {
    inputs = []
  } else {
    inputs = [data.latest_token_id]
  }
  outputs = [buildBuildOutputs(data, parts_to_recipe, type)]
  return {
    ...((type == 'progress-update' || type == 'Complete') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
