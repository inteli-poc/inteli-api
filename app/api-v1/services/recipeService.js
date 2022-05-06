const { getAttachment, addRecipe } = require('../../db')
const { BadRequestError } = require('../../utils/errors')

async function createRecipe(reqBody) {
  if (!reqBody) {
    throw new BadRequestError({ message: 'Invalid recipe input' })
  }

  const { imageAttachmentId } = reqBody

  const attachment = await getAttachment(imageAttachmentId)
  if (!attachment.length) {
    throw new BadRequestError({ message: 'Attachment id not found', service: 'recipe' })
  }

  const recipe = await addRecipe(reqBody)
  return recipe
}

module.exports = {
  createRecipe,
}
