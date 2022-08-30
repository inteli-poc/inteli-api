const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError, InternalError, NotFoundError } = require('../../../utils/errors')
const camelcaseObjectDeep = require('camelcase-object-deep')
const { runProcess } = require('../../../utils/dscp-api')
const { validate, mapOrderData } = require('./helpers')

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
        newItem.attachmentId = item.image_attachment_id
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
        newItem.attachmentId = item.image_attachment_id
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
    getAll: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')
        const buildTransactions = await db.getBuildTransactions(id, type)
        let build = await db.getBuildById(id)
        const modifiedBuildTransactions = buildTransactions.map((item) => {
          let newItem = {}
          newItem['id'] = item['id']
          newItem['status'] = item['status']
          newItem['submittedAt'] = item['created_at'].toISOString()
          if (build) {
            if (type != 'Complete') {
              newItem['completionEstimate'] = build[0].completion_estimated_at.toISOString()
            }
            if (type == 'Start') {
              newItem['startedAt'] = build[0].started_at.toISOString()
            }
            if (type == 'progress-update' || type == 'Complete') {
              newItem['attachmentId'] = build[0].image_attachment_id
            }
            if (type == 'Complete') {
              newItem['completedAt'] = build[0].completed_at.toISOString()
            }
          }
          return newItem
        })

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
        if (type == 'Schedule') {
          transactionId = req.params.scheduleId
        } else if (type == 'Start') {
          transactionId = req.params.startId
        } else if (type == 'progress-update') {
          transactionId = req.params.updateId
        } else if (type == 'Complete') {
          transactionId = req.params.completionId
        }
        if (!id) throw new BadRequestError('missing params')
        const buildTransactions = await db.getBuildTransactionsById(transactionId, id, type)
        let build = await db.getBuildById(id)
        const modifiedBuildTransactions = buildTransactions.map((item) => {
          let newItem = {}
          newItem['id'] = item['id']
          newItem['status'] = item['status']
          newItem['submittedAt'] = item['created_at'].toISOString()
          if (build) {
            if (type != 'Complete') {
              newItem['completionEstimate'] = build[0].completion_estimated_at.toISOString()
            }
            if (type == 'Start') {
              newItem['startedAt'] = build[0].started_at.toISOString()
            }
            if (type == 'progress-update' || type == 'Complete') {
              newItem['attachmentId'] = build[0].image_attachment_id
            }
            if (type == 'Complete') {
              newItem['completedAt'] = build[0].completed_at.toISOString()
            }
          }
          return newItem
        })

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
        const supplier = build.supplier
        const parts = await db.getPartsByBuildId(id)
        const recipes = parts.map((item) => {
          return item.recipe_id
        })
        const records = await db.getRecipeByIDs(recipes)
        const tokenIds = records.map((el) => el.latest_token_id)
        const buyer = records[0].owner
        if (!build) throw new NotFoundError('build')
        if (type == 'Schedule') {
          if (build.status != 'Created') {
            throw new InternalError({ message: 'Build not in Created state' })
          } else {
            build.status = 'Scheduled'
            build.completion_estimated_at = req.body.completionEstimate
          }
        } else if (type == 'Start') {
          if (build.status != 'Scheduled') {
            throw new InternalError({ message: 'Build not in Scheduled state' })
          } else {
            build.status = 'Started'
            build.completion_estimated_at = req.body.completionEstimate
            build.started_at = req.body.startedAt
          }
        } else if (type == 'progress-update') {
          if (build.status != 'Started') {
            throw new InternalError({ message: 'Build not in Started state' })
          } else {
            build.status = 'Started'
            build.completion_estimated_at = req.body.completionEstimate
            build.image_attachment_id = req.body.attachmentId
            const [attachment] = await db.getAttachment(build.image_attachment_id)
            if (attachment) {
              binary_blob = attachment.binary_blob
              filename = attachment.filename
            }
          }
        } else if (type == 'Complete') {
          if (build.status != 'Started') {
            throw new InternalError({ message: 'Build not in Started state' })
          } else {
            build.status = 'Completed'
            build.completed_at = req.body.completedAt
            build.image_attachment_id = req.body.attachmentId
            const [attachment] = await db.getAttachment(build.image_attachment_id)
            if (attachment) {
              binary_blob = attachment.binary_blob
              filename = attachment.filename
            }
          }
        }

        const transaction = await db.insertBuildTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapOrderData(
            { ...build, transaction, tokenIds, supplier, buyer, binary_blob, filename },
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
          response: {
            id: transaction.id,
            submittedAt: new Date(transaction.created_at).toISOString(),
            status: transaction.status,
            ...(type != 'Complete' && { completionEstimate: req.body.completionEstimate }),
            ...(type == 'Start' && { startedAt: req.body.startedAt }),
            ...((type == 'progress-update' || type == 'Complete') && { attachmentId: req.body.attachmentId }),
            ...(type == 'Complete' && { completedAt: req.body.completedAt }),
          },
        }
      }
    },
  },
}
