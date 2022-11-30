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
    await module.exports.getBuildAttachments(result)
    return {
      status: 200,
      response: result,
    }
  },
  getById: async function (req) {
    const { id } = req.params
    if (!id) {
      throw new BadRequestError('missing params')
    }
    const build = await db.getBuildById(id)
    let result = await getResultForBuildGet(build, req)
    await module.exports.getBuildAttachments(result)
    return {
      status: 200,
      response: result[0],
    }
  },
  getBuildAttachments: async function (result) {
    for (let buildResponse of result) {
      let req = {}
      req.params = { id: buildResponse.id }
      let buildObj = {}
      try {
        let buildProgressUpdateResult = await module.exports.transaction.getAll('progress-update')(req)
        buildObj.progressUpdate = buildProgressUpdateResult.response
      } catch (err) {
        buildObj.progressUpdate = []
      }
      try {
        let buildCompleteResult = await module.exports.transaction.getAll('Complete')(req)
        buildObj.complete = buildCompleteResult.response
      } catch (err) {
        buildObj.complete = []
      }
      let asnUploaded = true
      if (buildObj.progressUpdate.length != 0) {
        for (let item of buildObj.progressUpdate) {
          if (item['updateType'] == 'ASN Uploaded') {
            buildResponse['asnAttachmentId'] = item['attachmentId']
          } else if (item['updateType'] == 'Invoice Uploaded') {
            buildResponse['invoiceAttachmentId'] = item['attachmentId']
            asnUploaded = false
          } else if (item['updateType'] == 'GRN Uploaded') {
            buildResponse['grnAttachmentId'] = item['attachmentId']
          }
        }
      }
      if (buildObj.complete.length != 0) {
        if (asnUploaded) {
          buildResponse['invoiceAttachmentId'] = buildObj.complete[buildObj.complete.length - 1]['attachmentId']
        } else {
          buildResponse['asnAttachmentId'] = buildObj.complete[buildObj.complete.length - 1]['attachmentId']
        }
      }
    }
  },
  create: async function (req) {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    let duplicateExternalId = await db.checkDuplicateExternalId(req.body.externalId, 'build')
    if (duplicateExternalId.length != 0) {
      throw new InternalError({ message: 'duplicate externalId found' })
    }
    const items = await Promise.all(
      req.body.partIds.map(async (item) => {
        let [part] = await db.getPartById(item)
        if (!part) {
          throw new NotFoundError('part not found')
        }
        return part.recipe_id
      })
    )
    const selfAddress = await identity.getMemberBySelf(req)
    const { alias: supplierAlias } = await identity.getMemberByAddress(req, selfAddress)
    await validate(items, selfAddress)
    const build = {}
    build.supplier = selfAddress
    build.external_id = req.body.externalId
    build.completion_estimate = req.body.completionEstimate
    build.status = 'Created'
    const [buildId] = await db.postBuildDb(build)
    let partIds = req.body.partIds
    let updateOriginalTokenId = false
    for (let partId of partIds) {
      let [part] = await db.getPartById(partId)
      part.build_id = buildId.id
      await db.updatePart(part, part.latest_token_id, updateOriginalTokenId)
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
        const recipes = parts.map((item) => {
          return item.recipe_id
        })
        const partIds = parts.map((item) => {
          return item.id
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
            if (build.status != 'Started' && build.status != 'Completed') {
              throw new InternalError({ message: 'Build not in Started or Completed state' })
            }
            if (req.body.updateType == 'GRN Uploaded') {
              build.status = 'Part Received'
            } else {
              build.status = 'Started'
            }
            build.update_type = req.body.updateType
            if (req.body.completionEstimate) {
              build.completion_estimate = req.body.completionEstimate
            }
            build.attachment_id = req.body.attachmentId
            if (build.attachment_id) {
              attachment = await db.getAttachment(build.attachment_id)
              if (attachment.length == 0) {
                throw new NotFoundError('attachment')
              }
              binary_blob = attachment[0].binary_blob
              filename = attachment[0].filename
            }
            break
          case 'Complete':
            if (
              build.status != 'Started' ||
              (build.update_type != 'ASN Uploaded' && build.update_type != 'Invoice Uploaded')
            ) {
              throw new InternalError({ message: 'Build not in Started state or ASN or Invoice not uploaded' })
            }
            build.status = 'Completed'
            build.completed_at = req.body.completedAt
            build.attachment_id = req.body.attachmentId
            build.update_type = null
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
          payload = await mapBuildData({ ...build, transaction, partIds, supplier, buyer, binary_blob, filename }, type)
        } catch (err) {
          await db.removeTransactionBuild(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updateBuildTransaction(transaction.id, result[0])
            let updateOriginalTokenIdForOrder = false
            if (type == 'Schedule') {
              updateOriginalTokenIdForOrder = true
              await db.updateBuild(build, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updateBuild(build, result[0], updateOriginalTokenIdForOrder)
              let [part_build] = await db.getPartsByBuildId(build.id)
              let part_order = await db.getPartsByOrderId(part_build.order_id)
              let orderComplete = true
              for (let part of part_order) {
                let [build] = await db.getBuildById(part.build_id)
                if (build.status != 'Part Received') {
                  orderComplete = false
                  break
                }
              }
              if (orderComplete) {
                let [order] = await db.getOrder(part_build.order_id)
                order.status = 'Completed'
                await db.updateOrder(order, order.latest_token_id, false)
              }
            }
          } else {
            return {
              status: 400,
              response: {
                message: 'No Token Ownership',
              },
            }
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
