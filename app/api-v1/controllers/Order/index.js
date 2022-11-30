const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const {
  mapOrderData,
  getResponse,
  getResultForOrderGet,
  getResultForOrderTransactionGet,
  getPartHistory,
  getBuildHistory,
} = require('./helpers')
const identity = require('../../services/identityService')
const { BadRequestError, NotFoundError, IdentityError, InternalError } = require('../../../utils/errors')
const partController = require('../Part/index')
module.exports = {
  post: async function (req) {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    let duplicateExternalId = await db.checkDuplicateExternalId(req.body.externalId, 'orders')
    if (duplicateExternalId.length != 0) {
      throw new InternalError({ message: 'duplicate externalId found' })
    }
    const { address: supplierAddress } = await identity.getMemberByAlias(req, req.body.supplier)
    const selfAddress = await identity.getMemberBySelf(req)
    const { alias: selfAlias } = await identity.getMemberByAddress(req, selfAddress)
    const order = { ...req.body, supplierAddress: supplierAddress, status: 'Created', buyerAddress: selfAddress }
    const parts = req.body.items
    let partResponseArray = []
    for (const part of parts) {
      let req = {}
      req.body = part
      let partResponse
      try {
        partResponse = await partController.post(req)
      } catch (err) {
        throw new InternalError({ message: 'failed to save part to db : ' + err.message })
      }
      partResponse = partResponse.response
      req = {}
      req.params = {}
      req.params.id = partResponse.id
      try {
        await partController.transaction.create('Creation')(req)
      } catch (err) {
        throw new InternalError({ message: 'failed to save part to chain : ' + err.message })
      }
      partResponseArray.push(partResponse)
    }
    order.items = await Promise.all(
      partResponseArray.map(async (item) => {
        return item.id
      })
    )
    let result
    let transactionResponse
    try {
      ;[result] = await db.postOrderDb(order)
    } catch (err) {
      throw new InternalError({ message: 'failed to save order to db : ' + err.message })
    }
    let updateOriginalTokenId = false
    const partsDb = await db.getPartByIDs(order.items)
    for (const part of partsDb) {
      part.order_id = result.id
      let latest_token_id = part.latest_token_id
      await db.updatePart(part, latest_token_id, updateOriginalTokenId)
    }
    try {
      let req = {}
      req.params = {}
      req.params.id = result.id
      transactionResponse = await module.exports.transaction.create('Submission')(req)
      result.status = 'Submitted'
    } catch (err) {
      throw new InternalError({ message: 'failed to save order ro chain : ' + err.message })
    }
    let partsArr = []
    for (let partId of order.items) {
      let partObj = {}
      partObj['partId'] = partId
      let [part] = await db.getPartById(partId)
      let [build] = await db.getBuildById(part.build_id)
      if (build) {
        partObj['buildStatus'] = build.status
        if (build.update_type) {
          partObj['update_type'] = build.update_type
        }
      }
      partsArr.push(partObj)
    }
    req.body.parts = partsArr
    delete req.body.items
    return {
      status: 201,
      response: {
        ...result,
        buyer: selfAlias,
        updatedAt: transactionResponse.response.updatedAt,
        ...req.body,
      },
    }
  },
  getById: async function (req) {
    let { id } = req.params
    if (!id) throw new BadRequestError('missing params')
    const result = await db.getOrder(id)
    let response = await getResultForOrderGet(result, req)
    return {
      status: 200,
      response: response[0],
    }
  },
  get: async function (req) {
    let result
    if (req.query.externalId) {
      result = await db.getOrdersByExternalId(req.query.externalId)
    } else {
      result = await db.getOrders()
    }
    let response = await getResultForOrderGet(result, req)
    if (req.query.externalId) {
      return {
        status: 200,
        response: response[0],
      }
    }
    return {
      status: 200,
      response: response,
    }
  },
  getSummary: async function () {
    let orders = await db.getOrders()
    let recipes = await db.getRecipes()
    let recipeCount = recipes.length
    let totalParts = []
    let totalPartsCount
    let manufactureCount = 0
    let shipCount = 0
    let orderCount = 0
    for (let order of orders) {
      let items = order.items
      totalParts.push(items)
      for (let item of items) {
        let [part] = await db.getPartById(item)
        if (part && part.build_id) {
          let [build] = await db.getBuildById(part.build_id)
          if (build.update_type) {
            manufactureCount = manufactureCount + 1
          } else if (build.status == 'Completed') {
            shipCount = shipCount + 1
          } else {
            orderCount = orderCount + 1
          }
        } else {
          orderCount = orderCount + 1
        }
      }
    }
    totalPartsCount = totalParts.length
    let orderSummary = {
      parts: totalPartsCount,
      design: recipeCount,
      manufacturing: manufactureCount,
      ship: shipCount,
      order: orderCount,
    }
    return {
      status: 200,
      response: orderSummary,
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
        } else if (type == 'Acknowledgement') {
          transactionId = req.params.acknowledgementId
        } else if (type == 'Acceptance') {
          transactionId = req.params.acceptanceId
        } else if (type == 'Amendment') {
          transactionId = req.params.amendmentId
        } else if (type == 'Cancellation') {
          transactionId = req.params.cancellationId
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
        let items
        let updatedParts = []
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
            if (order.status != 'Submitted' && order.status != 'Amended') {
              throw new InternalError({ message: 'Order not in Submitted or Amended state' })
            }
            order.status = 'AcknowledgedWithExceptions'
            items = req.body.items

            for (let part of items) {
              updatedParts.push(part.id)
              let [partDetails] = await db.getPartById(part.id)
              if (!partDetails) {
                throw new NotFoundError('part not found')
              }
              if (partDetails.order_id !== id) {
                throw new InternalError({ message: 'part id mismatch' })
              }
              let req = {}
              req.params = {}
              req.params.id = part.id
              req.body = part
              await partController.transaction.create('acknowledgement')(req)
            }
            order.image_attachment_id = req.body.imageAttachmentId
            order.comments = req.body.comments
            if (order.image_attachment_id) {
              attachment = await db.getAttachment(order.image_attachment_id)
              if (attachment.length == 0) {
                throw new NotFoundError('attachment')
              }
              binary_blob = attachment[0].binary_blob
              filename = attachment[0].filename
            }
            break
          case 'Amendment':
            if (order.status != 'AcknowledgedWithExceptions') {
              throw new InternalError({ message: 'Order not in AcknowledgedWithExceptions state' })
            }
            order.status = 'Amended'
            items = req.body.items
            for (let part of items) {
              updatedParts.push(part.id)
              let req = {}
              req.params = {}
              req.params.id = part.id
              req.body = part
              await partController.transaction.create('amendment')(req)
            }
            order.image_attachment_id = null
            order.comments = null
            break
          case 'Acceptance':
            if (order.status != 'Submitted' && order.status != 'Amended') {
              throw new InternalError({ message: 'Order not in Submitted or Amended state' })
            }
            order.status = 'Accepted'
            break
          case 'Cancellation':
            if (order.status != 'AcknowledgedWithExceptions') {
              throw new InternalError({ message: 'Order not in AcknowledgedWithExceptions state' })
            }
            order.status = 'Cancelled'
            break
        }
        const selfAddress = await identity.getMemberBySelf(req)
        if (!selfAddress) throw new IdentityError()

        const transaction = await db.insertOrderTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapOrderData(
            { ...order, selfAddress, transaction, binary_blob, filename, updatedParts },
            type
          )
        } catch (err) {
          await db.removeTransactionOrder(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updateOrderTransaction(transaction.id, result[0])
            let updateOriginalTokenIdForOrder = false
            if (type == 'Submission') {
              updateOriginalTokenIdForOrder = true
              await db.updateOrder(order, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updateOrder(order, result[0], updateOriginalTokenIdForOrder)
            }
          } else {
            return {
              status: 400,
              response: {
                message: 'No Token Ownership',
              },
            }
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
    getHistory: async (req) => {
      let { id } = req.params
      if (!id) throw new BadRequestError('missing params')
      let orderObj = {}
      orderObj.order = {}
      try {
        let orderSubmissionResult = await module.exports.transaction.get('Submission')(req)
        orderObj.order.submission = orderSubmissionResult.response
      } catch (err) {
        orderObj.order.submission = []
      }
      try {
        let orderAcknowledgementResult = await module.exports.transaction.get('Acknowledgement')(req)
        orderObj.order.acknowledgement = orderAcknowledgementResult.response
      } catch (err) {
        orderObj.order.acknowledgement = []
      }
      try {
        let orderAmendmentResult = await module.exports.transaction.get('Amendment')(req)
        orderObj.order.amendment = orderAmendmentResult.response
      } catch (err) {
        orderObj.order.amendment = []
      }
      try {
        let orderCancellationResult = await module.exports.transaction.get('Cancellation')(req)
        orderObj.order.cancellation = orderCancellationResult.response
      } catch (err) {
        orderObj.order.cancellation = []
      }
      try {
        let orderAcceptanceResult = await module.exports.transaction.get('Acceptance')(req)
        orderObj.order.acceptance = orderAcceptanceResult.response
      } catch (err) {
        orderObj.order.acceptance = []
      }
      let orderHistory = {}
      let [order] = await db.getOrder(id)
      if (!order) {
        throw new NotFoundError('order')
      }
      let items = order.items
      orderHistory['id'] = order.id
      orderHistory['externalId'] = order.external_id
      orderHistory['parts'] = []
      for (let partId of items) {
        let partObj = {}
        let [part] = await db.getPartById(partId)
        partObj['id'] = part.id
        partObj['forecastedDeliveryDate'] = part.forecast_delivery_date.toISOString()
        partObj['requiredBy'] = part.required_by.toISOString()
        if (part.build_id) {
          partObj['buildId'] = part.build_id
          let [build] = await db.getBuildById(part.build_id)
          partObj['buildExternalId'] = build.external_id
        }
        partObj['history'] = []
        let order = orderObj['order']
        if (order.submission.length != 0) {
          let stage = {}
          stage['status'] = 'Purchase Order Shared'
          stage['submittedAt'] = order.submission[order.submission.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        if (order.acknowledgement.length != 0) {
          let stage = {}
          stage['status'] = 'Purchase Order Acknowledged'
          stage['submittedAt'] = order.acknowledgement[order.acknowledgement.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        if (order.amendment.length != 0) {
          let stage = {}
          stage['status'] = 'Purchase Order Amended'
          stage['submittedAt'] = order.amendment[order.amendment.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        if (order.acceptance.length != 0) {
          let stage = {}
          stage['status'] = 'Purchase Order Accepted'
          stage['submittedAt'] = order.acceptance[order.acceptance.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        if (order.cancellation.length != 0) {
          let stage = {}
          stage['status'] = 'Purchase Order Cancelled'
          stage['submittedAt'] = order.cancellation[order.cancellation.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        let req = {}
        req.params = { id: part.build_id }
        let buildObj = await getBuildHistory(req, part)
        if (buildObj.start.length != 0) {
          let stage = {}
          stage['status'] = 'Manufacturing Job Started'
          stage['submittedAt'] = buildObj.start[buildObj.start.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        if (buildObj.progressUpdate.length != 0) {
          for (let item of buildObj.progressUpdate) {
            let stage = {}
            if (item['updateType'] == 'GRN Uploaded') {
              stage['status'] = 'Part Received'
            } else {
              stage['status'] = item['updateType']
            }
            stage['submittedAt'] = item['submittedAt']
            partObj['history'].push(stage)
          }
        }
        if (buildObj.complete.length != 0) {
          let stage = {}
          stage['status'] = 'Shipped & Invoice Received'
          stage['submittedAt'] = buildObj.complete[buildObj.complete.length - 1].submittedAt
          partObj['history'].push(stage)
        }
        let partHistory = await getPartHistory(part)
        if (partHistory.certification.length != 0) {
          for (let certification of partHistory.certification) {
            let stage = {}
            stage['status'] = certification['certificationType']
            stage['submittedAt'] = certification['submittedAt']
            partObj['history'].push(stage)
          }
        }
        orderHistory.parts.push(partObj)
      }
      if (orderHistory && orderHistory.parts) {
        for (let part of orderHistory.parts) {
          part.history.sort((a, b) => {
            let time1 = new Date(a.submittedAt)
            let timeStamp1 = time1.getTime()
            let time2 = new Date(b.submittedAt)
            let timeStamp2 = time2.getTime()
            return timeStamp1 - timeStamp2
          })
        }
      }
      return {
        status: 200,
        response: orderHistory,
      }
    },
  },
}
