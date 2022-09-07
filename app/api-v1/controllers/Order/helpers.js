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

const buildOrderOutput = (data, recipes,type) => {
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
        transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
        externalId: { type: 'LITERAL', value: data.external_id },
        ...(type == 'Acknowledgement' && data.filename) && {image: {type: 'FILE', value: data.filename}},
        ...(type == 'Acknowledgement') && {imageAtttachmentId: {type: 'LITERAL', value: data.image_attachment_id}},
        price: {type: 'LITERAL', value: data.price.toString()},
        quantity: {type: 'LITERAL', value: data.quantity.toString()},
        forecastDate: {type: 'LITERAL', value: data.forecast_date},
        ...(type == 'Acknowledgement' && data.comments) && {comments: {type: 'LITERAL', value: data.comments}},
        ...recipes,
        id: { type : 'LITERAL', value: data.id}
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
  const recipes = records.reduce((output, id, index) => {
    if (id) {
      output['recipe_' + index] = {
        type: 'LITERAL',
        value: id,
      }
    }

    return output
  }, {})
  const inputs = type != 'Acceptance' && type != 'Acknowledgement' ? orderTokenId.concat(tokenIds) : orderTokenId
  const outputs =
    type != 'Acceptance' && type != 'Acknowledgement'
      ? [buildOrderOutput(data, recipes, type), ...buildRecipeOutputs(data, tokenIds, parentIndexOffset, type)]
      : [buildOrderOutput(data, recipes, type)]
  return {
    ...(type == 'Acknowledgement' && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs: outputs,
  }
}
