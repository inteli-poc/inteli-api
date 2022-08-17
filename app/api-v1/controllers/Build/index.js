const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError } = require('../../../utils/errors')
const { validate } = require('./helpers')
const camelcaseObjectDeep = require('camelcase-object-deep')

module.exports = {
  getAll: async function (req) {
    const build = await db.getBuild()
    const result = await Promise.all(
      build.map(async (item) => {
        const newItem = {}
        const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
        newItem.supplier = supplierAlias
        newItem.externalId = item.external_id
        const partIds = await db.getPartIdsByBuildId(item.id)
        newItem.partIds = partIds.map((item) => {
          return item.id
        })
        newItem.status = item.status
        newItem.id = item.id
        newItem.completionEstimatedAt = item.completion_estimated_at.toISOString()
        newItem.startedAt = item.started_at ? item.started_at.toISOString() : item.started_at
        newItem.completedAt = item.completed_at ? item.completed_at.toISOString() : item.completed_at
        return newItem
      })
    )
    return { status: 200, response: result }
  },
  getById: async function (req) {
    const { id } = req.params
    const build = await db.getBuildById(id)
    const result = await Promise.all(
      build.map(async (item) => {
        const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
        const newItem = {}
        newItem.supplier = supplierAlias
        newItem.status = item.status
        newItem.id = item.id
        newItem.externalId = item.external_id
        const partIds = await db.getPartIdsByBuildId(item.id)
        newItem.partIds = partIds.map((item) => {
          return item.id
        })
        newItem.completionEstimatedAt = item.completion_estimated_at.toISOString()
        newItem.startedAt = item.started_at ? item.started_at.toISOString() : item.started_at
        newItem.completedAt = item.completed_at ? item.completed_at.toISOString() : item.completed_at
        return newItem
      })
    )
    return { status: 200, response: result }
  },
  create: async function (req) {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    const items = req.body.parts.map((item) => {
      return item.recipeId
    })
    const selfAddress = await identity.getMemberBySelf(req)
    const { alias: supplierAlias } = await identity.getMemberByAddress(req, selfAddress)
    await validate(items, selfAddress)
    const build = {}
    build.supplier = selfAddress
    build.external_id = req.body.externalId
    build.completion_estimated_at = req.body.completionEstimate
    build.completed_at = null
    build.started_at = null
    build.status = 'Created'
    const [buildId] = await db.postBuildDb(build)
    let parts = req.body.parts
    let partIds = []
    for (let index = 0; index < parts.length; index++) {
      const part = {}
      part.supplier = selfAddress
      part.build_id = buildId.id
      part.recipe_id = parts[index].recipeId
      part.certifications = null
      let [partId] = await db.postPartDb(part)
      partIds.push(partId.id)
    }
    build.id = buildId.id
    build.partIds = partIds
    build.supplier = supplierAlias
    return { status: 201, response: camelcaseObjectDeep(build) }
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
