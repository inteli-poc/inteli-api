// const db = require('../../../db')
const identity = require('../../services/identityService')
const { NotFoundError } = require('../../../utils/errors')
const { getMetadata } = require('../../../utils/dscp-api')
const db = require('../../../db')

exports.getResponse = async (type, transaction, req) => {
  return {
    id: req.params.id,
    transactionId: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...(type == 'Start' && { startedAt: req.body.startedAt }),
    ...(type == 'Completed' && { completedAt: req.body.completedAt }),
    ...(type == 'Start' && { taskNumber: req.body.taskNumber }),
  }
}

exports.getResultForMachiningOrderGet = async (result, req) => {
  if (result.length == 0) {
    throw new NotFoundError('machining order')
  }
  const response = await Promise.all(
    result.map(async (item) => {
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      const newItem = {}
      newItem['supplier'] = supplierAlias
      newItem['id'] = item['id']
      newItem['status'] = item['status']
      newItem['partId'] = item['part_id']
      newItem['externalId'] = item['external_id']
      newItem['taskNumber'] = item['task_id']
      return newItem
    })
  )
  return response
}

exports.getResultForMachiningOrderTransactionGet = async (machiningOrderTransactions, type, id) => {
  if (machiningOrderTransactions.length == 0) {
    throw new NotFoundError('machining_order_transactions')
  }
  let machiningOrder = await db.getMachiningOrderById(id)
  if (machiningOrder.length == 0) {
    throw new NotFoundError('machining order')
  }
  const modifiedMachiningOrderTransactions = await Promise.all(
    machiningOrderTransactions.map(async (item) => {
      let taskNumber
      let startedAt
      let completedAt
      let newItem = {}
      newItem['transactionId'] = item['id']
      newItem['id'] = item['machining_order_id']
      newItem['status'] = item['status']
      newItem['submittedAt'] = item['created_at'].toISOString()
      switch (type) {
        case 'Start':
          startedAt = await getMetadata(item.token_id, 'startedAt')
          startedAt = startedAt.data
          newItem['startedAt'] = startedAt
          taskNumber = await getMetadata(item.token_id, 'taskNumber')
          taskNumber = taskNumber.data
          newItem['taskNumber'] = taskNumber
          break
        case 'Completed':
          completedAt = await getMetadata(item.token_id, 'completedAt')
          completedAt = completedAt.data
          newItem['completedAt'] = completedAt
          break
      }
      return newItem
    })
  )
  return modifiedMachiningOrderTransactions
}

const buildPartOutputs = (data, type) => {
  return {
    roles: {
      Owner: type == 'Completed' ? data.buyer : data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'PART' },
      id: { type: 'FILE', value: 'idPart.json' },
      transactionId: { type: 'LITERAL', value: data.transactionPart.id.replace(/-/g, '') },
      actionType: { type: 'LITERAL', value: 'ownership' },
    },
    parent_index: 1,
  }
}
const buildMachiningOrderOutputs = (data, type) => {
  return {
    roles: {
      Owner: data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'MACHININGORDER' },
      status: { type: 'LITERAL', value: data.status },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
      externalId: { type: 'LITERAL', value: data.external_id },
      ...(type == 'Start' && { startedAt: { type: 'LITERAL', value: data.started_at } }),
      ...(type == 'Completed' && { completedAt: { type: 'LITERAL', value: data.completed_at } }),
      partId: { type: 'FILE', value: 'partId.json' },
      id: { type: 'FILE', value: 'id.json' },
      actionType: { type: 'LITERAL', value: type },
      ...(type === 'Start' && { taskNumber: { type: 'LITERAL', value: data.task_id } }),
    },
    ...(type != 'Submitted' && { parent_index: 0 }),
  }
}

exports.mapMachiningOrderData = async (data, type) => {
  let inputs
  let outputs
  if (type == 'Submitted') {
    inputs = []
    outputs = [buildMachiningOrderOutputs(data, type)]
  } else if (type == 'Completed') {
    inputs = [data.latest_token_id, data.partLatestToken]
    outputs = [buildMachiningOrderOutputs(data, type)].concat([buildPartOutputs(data, type)])
  } else {
    inputs = [data.latest_token_id]
    outputs = [buildMachiningOrderOutputs(data, type)]
  }
  return {
    partId: Buffer.from(JSON.stringify(data.part_id)),
    id: Buffer.from(JSON.stringify(data.id)),
    idPart: Buffer.from(JSON.stringify(data.part_id)),
    inputs,
    outputs,
  }
}
