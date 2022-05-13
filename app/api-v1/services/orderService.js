const { postOrderDb, getRecipeByIDs } = require('../../db')
const { BadRequestError, IncorrectSupplierError } = require('../../utils/errors')

async function postOrder(reqBody) {
  // Will add a get function at a later date to check for duplication

  // This section checks if the order manufacturer does not match the supplier
  const uniqueRecipeIDs = [...new Set(reqBody.items)]
  const recipes = await getRecipeByIDs(uniqueRecipeIDs)
  if (recipes) {
    recipes.forEach((recipeItem) => {
      if (recipeItem.supplier != reqBody.supplier) {
        throw new IncorrectSupplierError({ message: 'Order post error - Supplier does not match', service: 'order' })
      }
    })
  }

  const result = await postOrderDb(reqBody)
  if (!result) {
    throw new BadRequestError({ message: 'Order post error', service: 'order' })
  } else {
    return { statusCode: 201, result }
  }
}

module.exports = {
  postOrder,
}
