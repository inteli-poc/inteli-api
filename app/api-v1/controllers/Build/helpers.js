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

const buildBuildOutputs = (data, recipes, type) => {
  return {
    roles: {
      Owner: data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'BUILD' },
      status: { type: 'LITERAL', value: data.status },
      completionEstimate: { type: 'LITERAL', value: data.completion_estimated_at },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
      externalId: { type: 'LITERAL', value: data.external_id },
      ...recipes,
    },
    ...(type != 'Schedule' && { parent_index: 0 }),
  }
}

exports.mapOrderData = async (data, type) => {
  let inputs
  let outputs
  const recipes = data.tokenIds.reduce((output, id) => {
    if (id) {
      output[id] = {
        type: 'TOKEN_ID',
        value: id,
      }
    }

    return output
  }, {})
  if (type == 'Schedule') {
    inputs = []
  } else {
    inputs = [data.latest_token_id]
  }
  outputs = [buildBuildOutputs(data, recipes, type)]
  return {
    inputs,
    outputs,
  }
}
