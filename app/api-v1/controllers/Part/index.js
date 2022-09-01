const db = require('../../../db')
const identity = require('../../services/identityService')

module.exports = {
  getAll: async function (req) {
    let parts
    parts = await db.getParts()
    const result = await Promise.all(
      parts.map(async (item) => {
        const newItem = {}
        const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
        newItem['supplier'] = supplierAlias
        newItem['buildId'] = item.build_id
        newItem['recipeId'] = item.recipe_id
        newItem['id'] = item.id
        newItem['certifications'] = item.certifications
        return newItem
      })
    )
    return { status: 200, response: result }
  },
  get: async function () {
    return { status: 500, response: { message: 'Not Implemented' } }
  },
  transaction: {
    getAll: async () => {
      return { status: 500, response: { message: 'Not Implemented' } }
    },
    get: async () => {
      return { status: 500, response: { message: 'Not Implemented' } }
    },
    create: async () => {
      return { status: 500, response: { message: 'Not Implemented' } }
    },
  },
}
