const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const { mapOrderData } = require('./helpers')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError, IdentityError } = require('../../../utils/errors')

module.exports = {
  getAll: async function () {
    return { status: 500, response: { message: 'Not Implemented' } }
  },
  get: async function () {
    return { status: 500, response: { message: 'Not Implemented' } }
  },
  transaction: {
    getAll: async () => {
      return { status: 500, response: { message: 'Not Implemented' } }
    },
    get: async () => {
      return { status: 500, response: { message: 'Not Implemented' } }
    },
    create: async (req) => {
      const { id } = req.params
      if (!id) throw new BadRequestError('missing params')

      const [order] = await db.getOrder(id)
      if (!order) throw new NotFoundError('order')

      const selfAddress = await identity.getMemberBySelf(req)
      if (!selfAddress) throw new IdentityError()

      const transaction = await db.insertOrderTransaction(id)
      const payload = await mapOrderData({ ...order, selfAddress, transaction, ...req.body })

      runProcess(payload, req.token)

      return {
        status: 201,
        response: {
          id: transaction.id,
          submittedAt: new Date(transaction.created_at).toISOString(),
          status: transaction.status,
        },
      }
    },
  },
}
