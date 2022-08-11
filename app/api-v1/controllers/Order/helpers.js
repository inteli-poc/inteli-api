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
      if (recipeItem.supplier != body.supplierAddress) {
        throw new BadRequestError('invalid supplier')
      }
    })
  }

  return body
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

const buildOrderOutput = (data, recipes,parentIndexRequired,type) => {
  if(parentIndexRequired){
    return {
      roles: {
        Owner: (type == 'Rejection') ? data.buyer : data.supplier,
        Buyer: data.buyer,
        Supplier: data.supplier,
      },
      metadata: {
        type: { type: 'LITERAL', value: 'ORDER' },
        status: { type: 'LITERAL', value: data.status },
        requiredBy: { type: 'LITERAL', value: data.required_by },
        transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
        ...recipes,
      },
      parent_index: 0
    }
  }
  else{
    return {
      roles: {
        Owner: data.supplier,
        Buyer: data.buyer,
        Supplier: data.supplier,
      },
      metadata: {
        type: { type: 'LITERAL', value: 'ORDER' },
        status: { type: 'LITERAL', value: data.status },
        requiredBy: { type: 'LITERAL', value: data.required_by },
        transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
        ...recipes,
      },
    }
  }
}
/*eslint-enable */

exports.mapOrderData = async (data, type) => {
  if (!data.items || data.items.length < 1) throw new NothingToProcess()
  const records = await db.getRecipeByIDs(data.items)
  const tokenIds = records.map((el) => el.latest_token_id)
  const orderTokenId = []
  let parentIndexOffset = 0
  let parentIndexRequired = false
  if (type != 'Submission') {
    orderTokenId.push(data.latest_token_id)
    parentIndexOffset = 1
    parentIndexRequired = true
  }
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
  const inputs = type != 'Acceptance' ? orderTokenId.concat(tokenIds) : []
  return {
    inputs,
    outputs: [
      buildOrderOutput(data, recipes, parentIndexRequired, type),
      ...buildRecipeOutputs(data, tokenIds, parentIndexOffset, type),
    ],
  }
}
