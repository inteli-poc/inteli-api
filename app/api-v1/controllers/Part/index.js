const db = require('../../../db')
const identity = require('../../services/identityService')
const { runProcess } = require('../../../utils/dscp-api')
const { mapOrderData } = require('./helpers')
const { InternalError } = require('../../../utils/errors')

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
        newItem['metadata'] = item.metadata
        return newItem
      })
    )
    return { status: 200, response: result }
  },
  get: async function (req) {
    let { id } = req.params
    let part
    part = await db.getPartById(id)
    const result = await Promise.all(
      part.map(async (item) => {
        const newItem = {}
        const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
        newItem['supplier'] = supplierAlias
        newItem['buildId'] = item.build_id
        newItem['recipeId'] = item.recipe_id
        newItem['id'] = item.id
        newItem['certifications'] = item.certifications
        newItem['metadata'] = item.metadata
        return newItem
      })
    )
    return { status: 200, response: result }
  },
  transaction: {
    getAll: (type) => {
      return async (req) => {
        let { id } = req.params
        let partTransanctions = await db.getPartTransactions(id, type)
        let [part] = await db.getPartById(id)
        const modifiedPartTransactions = partTransanctions.map((item) => {
          const newItem = {}
          newItem['id'] = item['id']
          newItem['submittedAt'] = item['created_at'].toISOString()
          newItem['status'] = item['status']
          if (type == 'metadata-update') {
            let metadata = part.metadata
            newItem['metadata'] = metadata
          }
          return newItem
        })
        return {
          status: 200,
          response: modifiedPartTransactions,
        }
      }
    },
    get: (type) => {
      return async (req) => {
        let { id } = req.params
        let transactionId
        if (type == 'metadata-update') {
          transactionId = req.params.updateId
        }
        let partTransanctions = await db.getPartTransactionsById(transactionId, id, type)
        let [part] = await db.getPartById(id)
        const modifiedPartTransactions = partTransanctions.map((item) => {
          const newItem = {}
          newItem['id'] = item['id']
          newItem['submittedAt'] = item['created_at'].toISOString()
          newItem['status'] = item['status']
          if (type == 'metadata-update') {
            let metadata = part.metadata
            newItem['metadata'] = metadata
          }
          return newItem
        })
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
        const { id } = req.params
        const [part] = await db.getPartById(id)
        if (type == 'metadata-update') {
          metadataType = req.body.metadataType
          imageAttachmentId = req.body.attachmentId
          if (part.metadata) {
            part.metadata = part.metadata.concat([req.body])
          } else {
            part.metadata = [req.body]
          }
          const [attachment] = await db.getAttachment(req.body.attachmentId)
          if (attachment) {
            binary_blob = attachment.binary_blob
            filename = attachment.filename
          }
        }
        const [recipe] = await db.getRecipeByIDdb(part.recipe_id)
        const tokenId = recipe.latest_token_id
        const buyer = recipe.owner
        const supplier = recipe.supplier
        const transaction = await db.insertPartTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapOrderData(
            { ...part, transaction, tokenId, supplier, buyer, binary_blob, filename, metadataType, imageAttachmentId },
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
          response: {
            id: transaction.id,
            submittedAt: new Date(transaction.created_at).toISOString(),
            status: transaction.status,
            ...((type == 'metadata-update' || type == 'certification') && { attachmentId: req.body.attachmentId }),
            ...(type == 'metadata-update' && { metadataType: req.body.metadataType }),
            ...(type == 'certification' && { certificationIndex: req.body.certificationIndex }),
            ...(type == 'order-assignment' && { orderId: req.body.orderId }),
          },
        }
      }
    },
  },
}
