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
  getById: async function (req) {
    let { id } = req.params
    const result = await db.getOrder(id)
    const promises = result.map(async (item) => {
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      const { alias: buyerAlias } = await identity.getMemberByAddress(req, item.purchaser)
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
    for await (let val of promises){
      modifiedResult.push(val)
    }
    return { 
      status: 200,
      response: modifiedResult
    }
  },
  get: async function (req) {
    const result = await db.getOrders()
    const promises = result.map(async (item) => {
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      const { alias: buyerAlias } = await identity.getMemberByAddress(req, item.purchaser)
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
    for await (let val of promises){
      modifiedResult.push(val)
    }
    return {
      status: 200,
      response: modifiedResult
    }
  },
  transaction: {
    getById: (type) => {
      return async (req) => {
        const { id,submissionId } = req.params
        if (!id) throw new BadRequestError('missing params')
        const orderTransactions = await db.getOrderTransactionsById(submissionId,id,type)
        let results = null
        if(type == 'Rejection' || type == 'Amendment'){
          results = await db.getOrder(id)
        }
        const modifiedOrderTransactions = orderTransactions.map((item,index) => {
          const newItem = {}
          newItem['id'] = item['id']
          newItem['submittedAt'] = item['created_at'].toISOString()
          newItem['status'] = item['status']
          if(results){
            newItem['items'] = results[0].items
            newItem['requiredBy'] = results[0].required_by.toISOString()
          }
          return newItem
        })
        return {
          status: 200,
          response: modifiedOrderTransactions[0]
        }
      }
    },
    get: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')
        const orderTransactions = await db.getOrderTransactions(id,type)
        let results = null
        if(type == 'Rejection' || type == 'Amendment'){
          results = await db.getOrder(id)
        }
        const modifiedOrderTransactions = orderTransactions.map((item,index) => {
          const newItem = {}
          newItem['id'] = item['id']
          newItem['submittedAt'] = item['created_at'].toISOString()
          newItem['status'] = item['status']
          if(results){
            newItem['items'] = results[0].items
            newItem['requiredBy'] = results[0].required_by.toISOString()
          }
          return newItem
        })
        return {
          status: 200,
          response: modifiedOrderTransactions
        }
      }
    },
    create: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')
  
        const [order] = await db.getOrder(id)
        if (!order) throw new NotFoundError('order')
  
        const selfAddress = await identity.getMemberBySelf(req)
        if (!selfAddress) throw new IdentityError()
  
        const transaction = await db.insertOrderTransaction(id,type)
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
      }
    }
  },
}
