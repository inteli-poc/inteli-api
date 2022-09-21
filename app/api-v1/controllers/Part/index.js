const db = require('../../../db')
const { runProcess } = require('../../../utils/dscp-api')
const {
  mapPartData,
  getResponse,
  getResultForPartGet,
  getResultForPartTransactionGet,
  checkAttachment,
  insertCertificationIntoPart,
} = require('./helpers')
const { InternalError, BadRequestError, NotFoundError } = require('../../../utils/errors')

module.exports = {
  getAll: async function (req) {
    let parts
    parts = await db.getParts()
    let result = await getResultForPartGet(parts, req)
    return result
  },
  get: async function (req) {
    let { id } = req.params
    if (!id) {
      throw new BadRequestError('missing params')
    }
    let parts
    parts = await db.getPartById(id)
    let result = await getResultForPartGet(parts, req)
    return result
  },
  transaction: {
    getAll: (type) => {
      return async (req) => {
        let { id } = req.params
        if (!id) {
          throw new BadRequestError('missing params')
        }
        let partTransanctions = await db.getPartTransactions(id, type)
        let modifiedPartTransactions = await getResultForPartTransactionGet(partTransanctions, type, id)
        return {
          status: 200,
          response: modifiedPartTransactions,
        }
      }
    },
    get: (type) => {
      return async (req) => {
        let { id } = req.params
        if (!id) {
          throw new BadRequestError('missing params')
        }
        let transactionId
        switch (type) {
          case 'metadata-update':
            transactionId = req.params.updateId
            break
          case 'order-assignment':
            transactionId = req.params.assignmentId
            break
          case 'certification':
            transactionId = req.params.certificationId
            break
        }
        if (!transactionId) {
          throw new BadRequestError('missing params')
        }
        let partTransanctions = await db.getPartTransactionsById(transactionId, id, type)
        let modifiedPartTransactions = await getResultForPartTransactionGet(partTransanctions, type, id)
        return {
          status: 200,
          response: modifiedPartTransactions[0],
        }
      }
    },
    create: (type) => {
      return async (req) => {
        let binary_blob
        let filename
        let metadataType
        let imageAttachmentId
        let attachment
        let itemIndex
        let order
        let certificationIndex
        const { id } = req.params
        if (!id) {
          throw new BadRequestError('missing params')
        }
        const [part] = await db.getPartById(id)
        if (!part) {
          throw new NotFoundError('part')
        }
        const buildId = part.build_id
        const [build] = await db.getBuildById(buildId)
        const status = build.status
        if (status == 'Created') {
          throw new InternalError({ message: 'build is in created state' })
        }
        switch (type) {
          case 'metadata-update':
            metadataType = req.body.metadataType
            imageAttachmentId = req.body.attachmentId
            if (part.metadata) {
              part.metadata = part.metadata.concat([req.body])
            } else {
              part.metadata = [req.body]
            }
            attachment = await db.getAttachment(req.body.attachmentId)
            if (attachment.length == 0) {
              throw new NotFoundError('attachment')
            }
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
          case 'order-assignment':
            part.order_id = req.body.orderId
            itemIndex = req.body.itemIndex
            order = await db.getOrder(part.order_id)
            if (order.length == 0) {
              throw new NotFoundError('order')
            }
            if (order[0].status == 'Created') {
              throw new InternalError({ message: 'order is in created state' })
            }
            if (order[0].items[itemIndex] != part.recipe_id) {
              throw new InternalError({ message: 'recipe id mismatch' })
            }
            break
          case 'certification':
            certificationIndex = req.body.certificationIndex
            imageAttachmentId = req.body.attachmentId
            await insertCertificationIntoPart(part, certificationIndex, imageAttachmentId)
            attachment = await db.getAttachment(req.body.attachmentId)
            await checkAttachment(attachment)
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
        }
        const [recipe] = await db.getRecipeByIDdb(part.recipe_id)
        const tokenId = recipe.latest_token_id
        const buyer = recipe.owner
        const supplier = recipe.supplier
        const transaction = await db.insertPartTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapPartData(
            {
              ...part,
              transaction,
              tokenId,
              supplier,
              buyer,
              binary_blob,
              filename,
              metadataType,
              imageAttachmentId,
              certificationIndex,
            },
            type
          )
        } catch (err) {
          await db.removeTransactionPart(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updatePartTransaction(id, result[0])
            let updateOriginalTokenIdForOrder = false
            if (!part.latest_token_id) {
              updateOriginalTokenIdForOrder = true
              await db.updatePart(part, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updatePart(part, result[0], updateOriginalTokenIdForOrder)
            }
          } else {
            throw new InternalError({ message: result.message })
          }
        } catch (err) {
          await db.removeTransactionPart(transaction.id)
          await db.insertPartTransaction(id, type, 'Failed', 0)
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
