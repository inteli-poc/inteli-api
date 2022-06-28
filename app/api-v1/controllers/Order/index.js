const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const { validate, mapOrderData } = require('./helpers')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError, IdentityError } = require('../../../utils/errors')

const _tmp = () => ({ status: 500, response: { message: 'Not Implemented' } })

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
  getById: _tmp, // TODO - mark
  get: _tmp, // TODO - mark
  transaction: {
    getById: _tmp,
    get: _tmp,
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
