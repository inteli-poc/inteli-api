const { getAttachment, addRecipe, getRecipes: getRecipesDb, getRecipeByIDdb } = require('../../db')
const { BadRequestError, ItemNotFoundError } = require('../../utils/errors')

async function createRecipe(reqBody) {
  if (!reqBody) {
    throw new BadRequestError({ message: 'Invalid recipe input' })
  }

  const { imageAttachmentId } = reqBody

  const attachment = await getAttachment(imageAttachmentId)
  if (!attachment.length) {
    throw new BadRequestError({ message: 'Attachment id not found', service: 'recipe' })
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
    throw new ItemNotFoundError({ message: 'Item not found', service: 'order' })
  } else {
    const result = recipeResult[0]
    return { statusCode: 200, result }
  }
}

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeByID,
}
