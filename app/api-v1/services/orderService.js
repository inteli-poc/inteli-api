const { postOrderDb, getRecipeByIDs } = require('../../db')
const { IncorrectSupplierError, RecipeDoesNotExistError } = require('../../utils/errors')

async function postOrder(reqBody) {
  // Will add a get function at a later date to check for duplication

  // This section checks if the order manufacturer does not match the supplier
  const uniqueRecipeIDs = [...new Set(reqBody.items)]

  const recipes = await getRecipeByIDs(uniqueRecipeIDs)
  if (recipes.length != uniqueRecipeIDs.length) {
    throw new RecipeDoesNotExistError({ message: 'Order post error - Recipe does not exist' })
  } else {
    recipes.forEach((recipeItem) => {
      if (recipeItem.supplier != reqBody.supplier) {
        throw new IncorrectSupplierError({ message: 'Order post error - Supplier does not match' })
      }
    })
  }

  const [result] = await postOrderDb({ ...reqBody, status: 'Created' })
  return { statusCode: 201, result }
}

module.exports = {
  postOrder,
}
