const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const {
  validate,
  mapOrderData,
  getResponse,
  getResultForOrderGet,
  getResultForOrderTransactionGet,
} = require('./helpers')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError, IdentityError, InternalError } = require('../../../utils/errors')

module.exports = {
  post: async function (req) {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    const { address: supplierAddress } = await identity.getMemberByAlias(req, req.body.supplier)
    const selfAddress = await identity.getMemberBySelf(req)
    const { alias: selfAlias } = await identity.getMemberByAddress(req, selfAddress)
    const validated = await validate({
      ...req.body,
      supplierAddress: supplierAddress,
      status: 'Created',
      buyerAddress: selfAddress,
    })
    const [result] = await db.postOrderDb(validated)

    return {
      status: 201,
      response: {
        ...result,
        buyer: selfAlias,
        ...req.body,
      },
    }
  },
  getById: async function (req) {
    let { id } = req.params
    if (!id) throw new BadRequestError('missing params')
    const result = await db.getOrder(id)
    let response = await getResultForOrderGet(result, req)
    return response
  },
  get: async function (req) {
    let result
    if (req.query.externalId) {
      result = await db.getOrdersByExternalId(req.query.externalId)
    } else {
      result = await db.getOrders()
    }
    let response = await getResultForOrderGet(result, req)
    return response
  },
  transaction: {
    getById: (type) => {
      return async (req) => {
        let id
        let transactionId
        id = req.params.id
        if (type == 'Submission') {
          transactionId = req.params.submissionId
        } else if (type == 'Acknowledgement') {
          transactionId = req.params.AcknowledgementId
        } else if (type == 'Acceptance') {
          transactionId = req.params.acceptanceId
        } else if (type == 'Amendment') {
          transactionId = req.params.amendmentId
        }
        if (!id) throw new BadRequestError('missing params')
        if (!transactionId) throw new BadRequestError('missing params')
        const orderTransactions = await db.getOrderTransactionsById(transactionId, id, type)
        let modifiedOrderTransactions = await getResultForOrderTransactionGet(orderTransactions, type, id)
        return {
          status: 200,
          response: modifiedOrderTransactions[0],
        }
      }
    },
    get: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')
        const orderTransactions = await db.getOrderTransactions(id, type)
        let modifiedOrderTransactions = await getResultForOrderTransactionGet(orderTransactions, type, id)
        return {
          status: 200,
          response: modifiedOrderTransactions,
        }
      }
    },
    create: (type) => {
      return async (req) => {
        let binary_blob = null
        let filename = null
        let attachment
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')

        const [order] = await db.getOrder(id)
        if (!order) throw new NotFoundError('order')
        switch (type) {
          case 'Submission':
            if (order.status != 'Created') {
              throw new InternalError({ message: 'Order not in Created state' })
            }
            order.status = 'Submitted'
            break
          case 'Acknowledgement':
            if (order.status != 'Submitted') {
              throw new InternalError({ message: 'Order not in Submitted state' })
            }
            order.status = 'AcknowledgedWithExceptions'
            order.required_by = req.body.requiredBy
            order.price = parseFloat(req.body.price)
            order.forecast_date = req.body.forecastDate
            order.quantity = parseInt(req.body.quantity)
            order.image_attachment_id = req.body.imageAttachmentId
            order.comments = req.body.comments
            attachment = await db.getAttachment(order.image_attachment_id)
            if (attachment.length == 0) {
              throw new NotFoundError('attachment')
            }
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
          case 'Amendment':
            if (order.status != 'AcknowledgedWithExceptions') {
              throw new InternalError({ message: 'Order not in AcknowledgedWithExceptions state' })
            }
            order.status = 'Amended'
            order.required_by = req.body.requiredBy
            order.items = req.body.items
            order.price = parseFloat(req.body.price)
            order.forecast_date = req.body.forecastDate
            order.quantity = parseInt(req.body.quantity)
            order.image_attachment_id = null
            order.comments = null
            break
          case 'Acceptance':
            if (order.status != 'Submitted' && order.status != 'Amended') {
              throw new InternalError({ message: 'Order not in Submitted or Amended state' })
            }
            order.status = 'Accepted'
            break
        }
        const selfAddress = await identity.getMemberBySelf(req)
        if (!selfAddress) throw new IdentityError()

        const transaction = await db.insertOrderTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapOrderData({ ...order, selfAddress, transaction, binary_blob, filename }, type)
        } catch (err) {
          await db.removeTransactionOrder(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updateOrderTransaction(id, result[0])
            let updateOriginalTokenIdForOrder = false
            if (type == 'Submission') {
              updateOriginalTokenIdForOrder = true
              await db.updateOrder(order, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updateOrder(order, result[0], updateOriginalTokenIdForOrder)
            }
            const updateOriginalTokenIdForRecipe = false
            order.items.forEach(async (element, index) => {
              await db.updateRecipe(element, result[index + 1], updateOriginalTokenIdForRecipe)
            })
          } else {
            throw new InternalError({ message: result.message })
          }
        } catch (err) {
          await db.removeTransactionOrder(transaction.id)
          await db.insertOrderTransaction(id, type, 'Failed', 0)
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
