const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError, IdentityError, InternalError } = require('../../../utils/errors')

module.exports = {
  getAll: async function (req) {
    const build = await db.getBuild()
    const result  = await Promise.all(build.map(async (item) => {
      const newItem = {...item}
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      newItem.supplier = supplierAlias
      newItem.externalId = item.external_id
      newItem.partIds = item.part_ids
      newItem.completionEstimatedAt = item.completion_estimated_at.toISOString()
      newItem.startedAt = item.started_at.toISOString()
      newItem.completedAt = item.completed_at.toISOString()
      return item
    }))
    return { status: 200, response: result }
  },
  getById: async function (req) {
    const { id } = req.params
    const build = await db.getBuildById(id)
    const result  = await Promise.all(build.map(async (item) => {
      const newItem = {...item}
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      newItem.supplier = supplierAlias
      newItem.externalId = item.external_id
      newItem.partIds = item.part_ids
      newItem.completionEstimatedAt = item.completion_estimated_at.toISOString()
      newItem.startedAt = item.started_at.toISOString()
      newItem.completedAt = item.completed_at.toISOString()
      return item
    }))
    return { status: 200, response: result }
  },
  create: async function () {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    const build = {}
    const selfAddress = await identity.getMemberBySelf(req)
    build.supplier = selfAddress
    build.external_id = req.body.externalId
    build.completion_estimated_at = req.body.completionEstimate
    build.completed_at = null
    build.started_at = null
    build.status = 'Created'
    const [buildId] = await db.postBuildDb(build)
    let parts = req.body.parts
    let partIds = []
    for(let index = 0; index <= parts.length; index++){
      const part = {}
      part.supplier = selfAddress
      part.build_id = buildId
      part.recipe_id = parts[index].recipeI
      part.certifications = null
      let partId = await db.postPartDb(part)
      partIds.push(partId)
    }
    build.id = buildId
    build.partIds = partIds
    return { status: 200, response: build}

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
