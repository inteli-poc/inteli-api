const db = require('../../../db')
const { NoTokenError, NothingToProcess, BadRequestError } = require('../../../utils/errors')

exports.validate = async (body) => {
  // Will add a get function at a later date to check for duplication
  // This section checks if the order supplier does not match the supplier
  const uniqueRecipeIDs = [...new Set(body.items)]

  const recipes = await db.getRecipeByIDs(uniqueRecipeIDs)
  if (recipes.length != uniqueRecipeIDs.length) {
    throw new BadRequestError('recipe not found')
  } else {
    recipes.map((recipeItem) => {
      if (recipeItem.supplier != body.supplier) {
        throw new BadRequestError('invalid supplier')
      }
    })
  }

  return body
}

/*eslint-disable */
const buildRecipeOutputs = (data, recipes) =>
  recipes.map((_, i) => ({
    roles: {
      Owner: data.selfAddress,
      Buyer: data.selfAddress,
      Supplier: data.supplier,
    },
    metadata: { type: { type: 'LITERAL', value: 'RECIPE' } },
    parent_index: i,
  }))

const buildOrderOutput = (data, recipes) => ({
  roles: {
    Owner: data.supplier,
    Buyer: data.selfAddress,
    Supplier: data.supplier,
  },
  metadata: {
    type: { type: 'LITERAL', value: 'ORDER' },
    status: { type: 'LITERAL', value: data.status },
    requiredBy: { type: 'LITERAL', value: data.required_by },
    transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
    ...recipes,
  },
})
/*eslint-enable */

exports.mapOrderData = async (data) => {
  if (!data.items || data.items.length < 1) throw new NothingToProcess()
  const records = await db.getRecipeByIDs(data.items)
  const tokenIds = records.map((el) => el.latest_token_id)
  if (!tokenIds.every(Boolean)) throw new NoTokenError('recipes')

  const recipes = tokenIds.reduce((output, id) => {
    if (id) {
      output[id] = {
        type: 'TOKEN_ID',
        value: id,
      }
    }

    return output
  }, {})

  return {
    inputs: tokenIds,
    outputs: [buildOrderOutput(data, recipes), ...buildRecipeOutputs(data, tokenIds)],
  }
}
