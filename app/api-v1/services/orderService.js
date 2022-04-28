const { postOrderDb } = require('../services/orderService')

async function postProject(reqBody) {
  // Will add a get function at a later date to check for duplication
  console.log('rqbody', reqBody)
  const createdProject = await postOrderDb(reqBody)

  const result = createdProject.length === 1 ? createdProject[0] : {}
  return { statusCode: 201, result }
}

module.exports = {
  postProject,
}
