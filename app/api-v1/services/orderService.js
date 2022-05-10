const { postOrderDb } = require('../../db')
const { BadRequestError } = require('../../utils/errors')

async function postOrder(reqBody) {
  // Will add a get function at a later date to check for duplication

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
