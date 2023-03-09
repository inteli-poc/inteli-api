const db = require('../../../db')
const identity = require('../../services/identityService')
const { BadRequestError, InternalError, NotFoundError } = require('../../../utils/errors')
const camelcaseObjectDeep = require('camelcase-object-deep')
const { runProcess } = require('../../../utils/dscp-api')
const {
  mapMachiningOrderData,
  getResponse,
  getResultForMachiningOrderGet,
  getResultForMachiningOrderTransactionGet,
} = require('./helpers')

module.exports = {
  get: async function (req) {
    let machiningOrder
    if (req.query.searchQuery) {
      machiningOrder = await db.getMachiningOrdersBySearchQuery(req.query.searchQuery)
    } else if (req.query.externalId) {
      machiningOrder = await db.getMachiningOrdersByExternalId(req.query.externalId)
    } else {
      machiningOrder = await db.getMachiningOrder(req.query.limit, req.query.page)
    }
    const result = await getResultForMachiningOrderGet(machiningOrder, req)
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
    const machiningOrder = await db.getMachiningOrderById(id)
    let result = await getResultForMachiningOrderGet(machiningOrder, req)
    return {
      status: 200,
      response: result[0],
    }
  },
  getCount: async function () {
    let totalOrderCount = await db.getMachiningOrderCount()
    return {
      status: 200,
      response: {
        count: parseInt(totalOrderCount[0].count),
      },
    }
  },
  post: async function (req) {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    let duplicateExternalId = await db.checkDuplicateExternalId(req.body.externalId, 'machiningorders')
    if (duplicateExternalId.length != 0) {
      throw new InternalError({ message: 'duplicate externalId found' })
    }
    let part_id = await db.getPartById(req.body.partId)
    if (part_id.length == 0) {
      throw new NotFoundError('part')
    }
    const machiningOrder = {}
    const { address: supplierAddress } = await identity.getMemberByAlias(req, req.body.supplier)
    const buyer = await identity.getMemberBySelf(req)
    machiningOrder.buyer = buyer
    machiningOrder.supplier = supplierAddress
    machiningOrder.external_id = req.body.externalId
    machiningOrder.part_id = req.body.partId
    machiningOrder.status = 'Created'
    const [machiningOrderId] = await db.postMachiningOrderDb(machiningOrder)
    machiningOrder.id = machiningOrderId.id
    const { alias: selfAlias } = await identity.getMemberByAddress(req, buyer)
    machiningOrder.buyer = selfAlias
    machiningOrder.supplier = req.body.supplier
    machiningOrder.taskNumber = null
    return { status: 201, response: camelcaseObjectDeep(machiningOrder) }
  },
  transaction: {
    getAll: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')
        const machiningOrderTransactions = await db.getMachiningOrderTransactions(id, type)
        let modifiedMachiningOrderTransactions = await getResultForMachiningOrderTransactionGet(
          machiningOrderTransactions,
          type,
          id
        )

        return {
          status: 200,
          response: modifiedMachiningOrderTransactions,
        }
      }
    },
    create: (type) => {
      return async (req) => {
        const { id } = req.params
        if (!id) throw new BadRequestError('missing params')

        const [machiningOrder] = await db.getMachiningOrderById(id)
        if (!machiningOrder) throw new NotFoundError('machining order')
        const buyer = machiningOrder.buyer
        const supplier = machiningOrder.supplier
        let partId
        let partLatestToken
        let transactionPart
        let duplicateTaskNumber
        switch (type) {
          case 'Submitted':
            if (machiningOrder.status !== 'Created') {
              throw new InternalError({ message: 'machinining order not in Created state' })
            }
            machiningOrder.status = 'Submitted'
            break
          case 'Accepted':
            if (machiningOrder.status !== 'Submitted') {
              throw new InternalError({ message: 'machinining order not in Submitted state' })
            }
            machiningOrder.status = 'Accepted'
            break
          case 'Start':
            if (machiningOrder.status !== 'Accepted') {
              throw new InternalError({ message: 'machinining order not in Accepted state' })
            }
            duplicateTaskNumber = await db.checkDuplicateTaskNumber(req.body.taskNumber, 'machiningorders')
            if (duplicateTaskNumber.length != 0) {
              throw new InternalError({ message: 'duplicate externalId found' })
            }
            machiningOrder.status = 'Started'
            machiningOrder.started_at = req.body.startedAt
            machiningOrder.task_id = req.body.taskNumber
            break
          case 'Completed':
            if (machiningOrder.status !== 'Started') {
              throw new InternalError({ message: 'machinining order not in Started state' })
            }
            machiningOrder.status = 'Completed'
            machiningOrder.completed_at = req.body.completedAt
            partId = await db.getPartById(machiningOrder.part_id)
            partLatestToken = partId[0].latest_token_id
            break
          case 'Part Shipped':
            if (machiningOrder.status !== 'Completed') {
              throw new InternalError({ message: 'machinining order not in Completed state' })
            }
            machiningOrder.status = 'Part Shipped'
            break
        }
        const transaction = await db.insertMachiningOrderTransaction(id, type, 'Submitted')
        if (type == 'Completed') {
          transactionPart = await db.insertPartTransaction(partId[0].id, 'ownership', 'Submitted')
        }
        let payload
        try {
          payload = await mapMachiningOrderData(
            { ...machiningOrder, transaction, buyer, supplier, transactionPart, partLatestToken },
            type
          )
        } catch (err) {
          await db.removeTransactionMachiningOrder(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updateMachiningOrderTransaction(transaction.id, result[0])
            if (type == 'Completed') {
              await db.updatePartTransaction(transactionPart.id, result[1])
            }
            let updateOriginalTokenIdForOrder = false
            if (type == 'Submitted') {
              updateOriginalTokenIdForOrder = true
              await db.updateMachiningOrder(machiningOrder, result[0], updateOriginalTokenIdForOrder)
            } else if (type == 'Completed') {
              partId[0].latest_token_id = result[1]
              await db.updatePart(partId[0], result[1], updateOriginalTokenIdForOrder)
              await db.updateMachiningOrder(machiningOrder, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updateMachiningOrder(machiningOrder, result[0], updateOriginalTokenIdForOrder)
            }
          } else {
            await db.removeTransactionMachiningOrder(transaction.id)
            return {
              status: 400,
              response: {
                message: 'No Token Ownership',
              },
            }
          }
        } catch (err) {
          await db.removeTransactionMachiningOrder(transaction.id)
          throw err
        }
        return {
          status: 201,
          response: await getResponse(type, transaction, req),
        }
      }
    },
    get: (type) => {
      return async (req) => {
        const { id } = req.params
        let transactionId
        switch (type) {
          case 'Submitted':
            transactionId = req.params.submittedId
            break
          case 'Start':
            transactionId = req.params.startId
            break
          case 'Completed':
            transactionId = req.params.completedId
            break
          case 'Accepted':
            transactionId = req.params.acceptedId
            break
          case 'Part Shipped':
            transactionId = req.params.partShippedId
            break
        }
        if (!id) throw new BadRequestError('missing params')
        if (!transactionId) throw new BadRequestError('missing params')
        const machiningOrderTransactions = await db.getMachiningOrderTransactionsById(transactionId, id, type)
        let modifiedMachiningOrderTransactions = await getResultForMachiningOrderTransactionGet(
          machiningOrderTransactions,
          type,
          id
        )

        return {
          status: 200,
          response: modifiedMachiningOrderTransactions[0],
        }
      }
    },
  },
}
