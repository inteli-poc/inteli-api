const { getAttachment, addRecipe, getRecipes: getRecipesDb, getRecipeByIDdb } = require('../../db')
const { BadRequestError, ItemNotFoundError } = require('../../utils/errors')

async function createRecipe(reqBody) {
  if (!reqBody) {
    throw new BadRequestError('Invalid recipe input')
  }

  const { image_attachment_id } = reqBody

  const attachment = await getAttachment(image_attachment_id)
  if (!attachment.length) {
    throw new BadRequestError('Attachment id not found')
  }

  const [recipe] = await addRecipe(reqBody)
  return recipe
}

async function getRecipes() {
  return getRecipesDb()
}

async function getRecipeByID(id) {
  const recipeResult = await getRecipeByIDdb(id)
  if (recipeResult.length === 0) {
    throw new ItemNotFoundError('Item not found')
  } else {
    const result = recipeResult[0]
    return result
  }
}

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeByID,
}
