const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError, InternalError, NotFoundError } = require('../../../utils/errors')
const camelcaseObjectDeep = require('camelcase-object-deep')
const { runProcess } = require('../../../utils/dscp-api')
const {
  validate,
  mapBuildData,
  getResponse,
  getResultForBuildGet,
  getResultForBuildTransactionGet,
} = require('./helpers')

module.exports = {
  getAll: async function (req) {
    const build = await db.getBuild()
    let result = await getResultForBuildGet(build, req)
    return result
  },
  getById: async function (req) {
    const { id } = req.params
    if (!id) {
      throw new BadRequestError('missing params')
    }
    const build = await db.getBuildById(id)
    let result = await getResultForBuildGet(build, req)
    return result
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
    build.completion_estimate = req.body.completionEstimate
    build.completed_at = null
    build.started_at = null
    build.attachment_id = null
    build.status = 'Created'
    const [buildId] = await db.postBuildDb(build)
    let parts = req.body.parts
    let partIds = []
    for (let value of parts) {
      const part = {}
      part.supplier = selfAddress
      part.build_id = buildId.id
      part.recipe_id = value.recipeId
      let [recipe] = await db.getRecipeByIDdb(part.recipe_id)
      part.certifications = JSON.stringify(recipe.required_certs)
      let [partId] = await db.postPartDb(part)
      partIds.push(partId.id)
    }
    build.id = buildId.id
    build.partIds = partIds
    build.supplier = supplierAlias
    return { status: 201, response: camelcaseObjectDeep(build) }
  },
  transaction: {
    getAll: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')
        const buildTransactions = await db.getBuildTransactions(id, type)
        let modifiedBuildTransactions = await getResultForBuildTransactionGet(buildTransactions, type, id)

        return {
          status: 200,
          response: modifiedBuildTransactions,
        }
      }
    },
    get: (type) => {
      return async (req) => {
        const { id } = req.params
        let transactionId
        switch (type) {
          case 'Schedule':
            transactionId = req.params.scheduleId
            break
          case 'Start':
            transactionId = req.params.startId
            break
          case 'progress-update':
            transactionId = req.params.updateId
            break
          case 'Complete':
            transactionId = req.params.completionId
            break
        }
        if (!id) throw new BadRequestError('missing params')
        if (!transactionId) throw new BadRequestError('missing params')
        const buildTransactions = await db.getBuildTransactionsById(transactionId, id, type)
        let modifiedBuildTransactions = await getResultForBuildTransactionGet(buildTransactions, type, id)

        return {
          status: 200,
          response: modifiedBuildTransactions[0],
        }
      }
    },
    create: (type) => {
      return async (req) => {
        let binary_blob
        let filename
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')

        const [build] = await db.getBuildById(id)
        if (!build) throw new NotFoundError('build')
        const supplier = build.supplier
        const parts = await db.getPartsByBuildId(id)
        const parts_to_recipe = parts.map((item) => {
          return { id: item.id, recipe_id: item.recipe_id }
        })
        const recipes = parts.map((item) => {
          return item.recipe_id
        })
        const records = await db.getRecipeByIDs(recipes)
        const buyer = records[0].owner
        let attachment
        switch (type) {
          case 'Schedule':
            if (build.status != 'Created') {
              throw new InternalError({ message: 'Build not in Created state' })
            }
            build.status = 'Scheduled'
            build.completion_estimate = req.body.completionEstimate
            break
          case 'Start':
            if (build.status != 'Scheduled') {
              throw new InternalError({ message: 'Build not in Scheduled state' })
            }
            build.status = 'Started'
            build.completion_estimate = req.body.completionEstimate
            build.started_at = req.body.startedAt
            break
          case 'progress-update':
            if (build.status != 'Started') {
              throw new InternalError({ message: 'Build not in Started state' })
            }
            build.status = 'Started'
            build.completion_estimate = req.body.completionEstimate
            build.attachment_id = req.body.attachmentId
            attachment = await db.getAttachment(build.attachment_id)
            if (attachment.length == 0) {
              throw new NotFoundError('attachment')
            }
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
          case 'Complete':
            if (build.status != 'Started') {
              throw new InternalError({ message: 'Build not in Started state' })
            }
            build.status = 'Completed'
            build.completed_at = req.body.completedAt
            build.attachment_id = req.body.attachmentId
            attachment = await db.getAttachment(build.attachment_id)
            if (attachment.length == 0) {
              throw new NotFoundError('attachment')
            }
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
        }
        const transaction = await db.insertBuildTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapBuildData(
            { ...build, transaction, parts_to_recipe, supplier, buyer, binary_blob, filename },
            type
          )
        } catch (err) {
          await db.removeTransactionBuild(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updateBuildTransaction(id, result[0])
            let updateOriginalTokenIdForOrder = false
            if (type == 'Schedule') {
              updateOriginalTokenIdForOrder = true
              await db.updateBuild(build, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updateBuild(build, result[0], updateOriginalTokenIdForOrder)
            }
          } else {
            throw new InternalError({ message: result.message })
          }
        } catch (err) {
          await db.removeTransactionBuild(transaction.id)
          await db.insertBuildTransaction(id, type, 'Failed', 0)
          throw err
        }
        return {
          status: 201,
          response: await getResponse(type, transaction, req),
        }
      }
    },
  },
}
