const { postOrderDb } = require('../../db')

async function postProject(reqBody) {
  // Will add a get function at a later date to check for duplication

  const result = await postOrderDb(reqBody)

  if (!result) {
    return { statusCode: 400, result: {} }
  } else {
    return { statusCode: 201, result }
  }
}

module.exports = {
  postProject,
}
