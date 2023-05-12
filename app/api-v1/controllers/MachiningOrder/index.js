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
    if (req.query.externalId) {
      return {
        status: 200,
        response: result[0],
      }
    }
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
    const [build] = await db.getBuildById(part_id[0].build_id)
    machiningOrder.buildExternalId = build.external_id
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
            machiningOrder.status = 'Started'
            machiningOrder.started_at = req.body.startedAt
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
            if (type === 'Submitted') {
              await db.removeMachiningOrder(id)
            }
            return {
              status: 400,
              response: {
                message: result.message,
              },
            }
          }
        } catch (err) {
          await db.removeTransactionMachiningOrder(transaction.id)
          if (type === 'Submitted') {
            await db.removeMachiningOrder(id)
          }
          throw err
        }
        return {
          status: 201,
          response: await getResponse(type, transaction, req),
        }
      }
    },
    getHistory: async (req) => {
      let { id } = req.params
      if (!id) throw new BadRequestError('missing params')
      let [machining] = await db.getMachiningOrderById(id)
      let machiningOrder = {}
      try {
        let machineOrderSubmission = await module.exports.transaction.getAll('Submitted')(req)
        machiningOrder.submission = machineOrderSubmission.response
      } catch (err) {
        machiningOrder.submission = []
      }
      try {
        let machineOrderStart = await module.exports.transaction.getAll('Start')(req)
        machiningOrder.start = machineOrderStart.response
      } catch (err) {
        machiningOrder.start = []
      }
      try {
        let machineOrderAcceptance = await module.exports.transaction.getAll('Accepted')(req)
        machiningOrder.acceptance = machineOrderAcceptance.response
      } catch (err) {
        machiningOrder.acceptance = []
      }
      try {
        let machineOrderCompletion = await module.exports.transaction.getAll('Completed')(req)
        machiningOrder.completion = machineOrderCompletion.response
      } catch (err) {
        machiningOrder.completion = []
      }
      try {
        let machineOrderPartShipped = await module.exports.transaction.getAll('Part Shipped')(req)
        machiningOrder.partshipped = machineOrderPartShipped.response
      } catch (err) {
        machiningOrder.partshipped = []
      }
      let machiningOrderHistory = {}
      machiningOrderHistory['history'] = []
      machiningOrderHistory['id'] = machining.id
      machiningOrderHistory['externalId'] = machining.external_id
      machiningOrderHistory['partId'] = machining.part_id
      if (machiningOrder.submission.length != 0) {
        let stage = {}
        stage['status'] = 'Machining Order Submitted'
        stage['submittedAt'] = machiningOrder.submission[machiningOrder.submission.length - 1].submittedAt
        machiningOrderHistory['history'].push(stage)
      }
      if (machiningOrder.acceptance.length != 0) {
        let stage = {}
        stage['status'] = 'Machining Order Accepted'
        stage['submittedAt'] = machiningOrder.submission[machiningOrder.acceptance.length - 1].submittedAt
        machiningOrderHistory['history'].push(stage)
      }
      if (machiningOrder.start.length != 0) {
        let stage = {}
        stage['status'] = 'Machining Order Started'
        stage['submittedAt'] = machiningOrder.submission[machiningOrder.start.length - 1].submittedAt
        machiningOrderHistory['history'].push(stage)
      }
      if (machiningOrder.completion.length != 0) {
        let stage = {}
        stage['status'] = 'Machining Order Completed'
        stage['submittedAt'] = machiningOrder.submission[machiningOrder.completion.length - 1].submittedAt
        machiningOrderHistory['history'].push(stage)
      }
      if (machiningOrder.partshipped.length != 0) {
        let stage = {}
        stage['status'] = 'Part Shipped'
        stage['submittedAt'] = machiningOrder.submission[machiningOrder.partshipped.length - 1].submittedAt
        machiningOrderHistory['history'].push(stage)
      }
      if (machiningOrderHistory && machiningOrderHistory.history) {
        machiningOrderHistory.history.sort((a, b) => {
          let time1 = new Date(a.submittedAt)
          let timeStamp1 = time1.getTime()
          let time2 = new Date(b.submittedAt)
          let timeStamp2 = time2.getTime()
          return timeStamp1 - timeStamp2
        })
      }
      return {
        status: 200,
        response: machiningOrderHistory,
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
