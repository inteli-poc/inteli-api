const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const { validate, mapOrderData } = require('./helpers')
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
    const result = await db.getOrder(id)
    const promises = result.map(async (item) => {
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      const { alias: buyerAlias } = await identity.getMemberByAddress(req, item.buyer)
      const newItem = {}
      newItem['buyer'] = buyerAlias
      newItem['supplier'] = supplierAlias
      newItem['id'] = item['id']
      newItem['status'] = item['status']
      newItem['items'] = item['items']
      newItem['requiredBy'] = item['required_by'].toISOString()
      return newItem
    })
    const modifiedResult = []
    for await (let val of promises) {
      modifiedResult.push(val)
    }
    return {
      status: 200,
      response: modifiedResult,
    }
  },
  get: async function (req) {
    let result
    if (req.query.externalId) {
      result = await db.getOrdersByExternalId(req.query.externalId)
    } else {
      result = await db.getOrders()
    }
    const promises = result.map(async (item) => {
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      const { alias: buyerAlias } = await identity.getMemberByAddress(req, item.buyer)
      const newItem = {}
      newItem['buyer'] = buyerAlias
      newItem['supplier'] = supplierAlias
      newItem['id'] = item['id']
      newItem['status'] = item['status']
      newItem['items'] = item['items']
      newItem['requiredBy'] = item['required_by'].toISOString()
      newItem['externalId'] = item['external_id']
      return newItem
    })
    const modifiedResult = []
    for await (let val of promises) {
      modifiedResult.push(val)
    }
    return {
      status: 200,
      response: modifiedResult,
    }
  },
  transaction: {
    getById: (type) => {
      return async (req) => {
        let id
        let transactionId
        id = req.params.id
        if (type == 'Submission') {
          transactionId = req.params.submissionId
        } else if (type == 'Rejection') {
          transactionId = req.params.rejectionId
        } else if (type == 'Acceptance') {
          transactionId = req.params.acceptanceId
        } else if (type == 'Amendment') {
          transactionId = req.params.amendmentId
        }
        if (!id) throw new BadRequestError('missing params')
        const orderTransactions = await db.getOrderTransactionsById(transactionId, id, type)
        let results = null
        if (type == 'Rejection' || type == 'Amendment') {
          results = await db.getOrder(id)
        }
        const modifiedOrderTransactions = orderTransactions.map((item) => {
          const newItem = {}
          newItem['id'] = item['id']
          newItem['submittedAt'] = item['created_at'].toISOString()
          newItem['status'] = item['status']
          if (results) {
            newItem['items'] = results[0].items
            newItem['requiredBy'] = results[0].required_by.toISOString()
          }
          return newItem
        })
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
        let results = null
        if (type == 'Rejection' || type == 'Amendment') {
          results = await db.getOrder(id)
        }
        const modifiedOrderTransactions = orderTransactions.map((item) => {
          const newItem = {}
          newItem['id'] = item['id']
          newItem['submittedAt'] = item['created_at'].toISOString()
          newItem['status'] = item['status']
          if (results) {
            newItem['items'] = results[0].items
            newItem['requiredBy'] = results[0].required_by.toISOString()
          }
          return newItem
        })
        return {
          status: 200,
          response: modifiedOrderTransactions,
        }
      }
    },
    create: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')

        const [order] = await db.getOrder(id)
        if (!order) throw new NotFoundError('order')
        if (type == 'Submission') {
          if (order.status != 'Created') {
            throw new InternalError({ message: 'Order not in Created state' })
          } else {
            order.status = 'Submitted'
          }
        } else if (type == 'Rejection') {
          if (order.status != 'Submitted') {
            throw new InternalError({ message: 'Order not in Submitted state' })
          } else {
            order.status = 'Rejected'
            order.required_by = req.body.requiredBy
            order.items = req.body.items
          }
        } else if (type == 'Amendment') {
          if (order.status != 'Rejected') {
            throw new InternalError({ message: 'Order not in Rejected state' })
          } else {
            order.status = 'Amended'
            order.required_by = req.body.requiredBy
            order.items = req.body.items
          }
        } else if (type == 'Acceptance') {
          if (order.status != 'Submitted' && order.status != 'Amended') {
            throw new InternalError({ message: 'Order not in Submitted or Amended state' })
          } else {
            order.status = 'Accepted'
          }
        }
        const selfAddress = await identity.getMemberBySelf(req)
        if (!selfAddress) throw new IdentityError()

        const transaction = await db.insertOrderTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapOrderData({ ...order, selfAddress, transaction }, type)
        } catch (err) {
          await db.removeTransactionOrder(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
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
        if (type == 'Rejection' || type == 'Amendment') {
          return {
            status: 201,
            response: {
              id: transaction.id,
              submittedAt: new Date(transaction.created_at).toISOString(),
              status: transaction.status,
              requiredBy: order.required_by.toISOString(),
              items: order.items,
            },
          }
        }
        return {
          status: 201,
          response: {
            id: transaction.id,
            submittedAt: new Date(transaction.created_at).toISOString(),
            status: transaction.status,
          },
        }
      }
    },
  },
}
