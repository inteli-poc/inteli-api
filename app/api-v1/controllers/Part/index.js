const db = require('../../../db')
const identity = require('../../services/identityService')
const { runProcess } = require('../../../utils/dscp-api')
const { mapOrderData } = require('./helpers')
const { InternalError, BadRequestError, NotFoundError } = require('../../../utils/errors')

module.exports = {
  getAll: async function (req) {
    let parts
    parts = await db.getParts()
    if (parts.length == 0) {
      throw new NotFoundError('parts')
    }
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
    if (!id) {
      throw new BadRequestError('missing params')
    }
    let part
    part = await db.getPartById(id)
    if (part.length == 0) {
      throw new NotFoundError('part')
    }
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
        if (!id) {
          throw new BadRequestError('missing params')
        }
        let partTransanctions = await db.getPartTransactions(id, type)
        if (partTransanctions.length == 0) {
          throw new NotFoundError('part_transactions')
        }
        let [part] = await db.getPartById(id)
        if (!part) {
          throw new NotFoundError('part')
        }
        const modifiedPartTransactions = await Promise.all(
          partTransanctions.map(async (item) => {
            const newItem = {}
            newItem['id'] = item['id']
            newItem['submittedAt'] = item['created_at'].toISOString()
            newItem['status'] = item['status']
            if (type == 'metadata-update') {
              let metadata = part.metadata
              newItem['metadata'] = metadata
            }
            if (type == 'order-assignment') {
              if (!part.order_id) {
                throw new NotFoundError('order')
              }
              newItem['orderId'] = part.order_id
              let [order] = await db.getOrder(part.order_id)
              let itemIndex = order.items.indexOf(part.recipe_id)
              newItem['itemIndex'] = itemIndex
            }
            return newItem
          })
        )
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
        if (type == 'metadata-update') {
          transactionId = req.params.updateId
        } else if (type == 'order-assignment') {
          transactionId = req.params.assignmentId
        }
        if (!transactionId) {
          throw new BadRequestError('missing params')
        }
        let partTransanctions = await db.getPartTransactionsById(transactionId, id, type)
        if (partTransanctions.length == 0) {
          throw new NotFoundError('part_transactions')
        }
        let [part] = await db.getPartById(id)
        if (!part) {
          throw new NotFoundError('part')
        }
        const modifiedPartTransactions = await Promise.all(
          partTransanctions.map(async (item) => {
            const newItem = {}
            newItem['id'] = item['id']
            newItem['submittedAt'] = item['created_at'].toISOString()
            newItem['status'] = item['status']
            if (type == 'metadata-update') {
              let metadata = part.metadata
              newItem['metadata'] = metadata
            }
            if (type == 'order-assignment') {
              if (!part.order_id) {
                throw new NotFoundError('order')
              }
              newItem['orderId'] = part.order_id
              let [order] = await db.getOrder(part.order_id)
              let itemIndex = order.items.indexOf(part.recipe_id)
              newItem['itemIndex'] = itemIndex
            }
            return newItem
          })
        )
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
          } else {
            throw new NotFoundError('attachment')
          }
        } else if (type == 'order-assignment') {
          part.order_id = req.body.orderId
          let itemIndex = req.body.itemIndex
          let [order] = await db.getOrder(part.order_id)
          if (!order) {
            throw new NotFoundError('order')
          }
          if (order.status == 'Created') {
            throw new InternalError({ message: 'order is in created state' })
          }
          if (order.items[itemIndex] != part.recipe_id) {
            throw new InternalError({ message: 'recipe id mismatch' })
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
            ...(type == 'metadata-update' && { metadata: [req.body] }),
            ...(type == 'certification' && { certificationIndex: req.body.certificationIndex }),
            ...(type == 'order-assignment' && { orderId: req.body.orderId }),
            ...(type == 'order-assignment' && { itemIndex: req.body.itemIndex }),
          },
        }
      }
    },
  },
}
