const knex = require('knex')
const env = require('../env')

const client = knex({
  client: 'pg',
  migrations: {
    tableName: 'migrations',
  },
  connection: {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  },
})

async function postOrderDb(reqBody) {
  return client('orders')
    .insert({
      supplier: reqBody.supplierAddress,
      items: reqBody.items,
      buyer: reqBody.buyerAddress,
      status: reqBody.status,
      external_id: reqBody.externalId,
      business_partner_code: reqBody.businessPartnerCode,
    })
    .returning(['id', 'status'])
}

async function postBuildDb(build) {
  return client('build').insert(build).returning(['id'])
}

async function postMachiningOrderDb(machiningOrder) {
  return client('machiningorders').insert(machiningOrder).returning(['id'])
}

async function postPartDb(part) {
  return client('parts').insert(part).returning(['id'])
}

async function updateOrder(reqBody, latest_token_id, updateOriginalTokenId) {
  const updated_at = new Date().toISOString()
  reqBody.updated_at = updated_at
  reqBody.latest_token_id = latest_token_id
  if (updateOriginalTokenId) {
    return client('orders')
      .update({ status: reqBody.status, updated_at, latest_token_id, original_token_id: latest_token_id })
      .where({ id: reqBody.id })
  } else {
    return client('orders').update(reqBody).where({ id: reqBody.id })
  }
}

async function updateBuild(reqBody, latest_token_id, updateOriginalTokenId) {
  const updated_at = new Date().toISOString()
  reqBody.updated_at = updated_at
  reqBody.latest_token_id = latest_token_id
  if (updateOriginalTokenId) {
    return client('build')
      .update({ status: reqBody.status, updated_at, latest_token_id, original_token_id: latest_token_id })
      .where({ id: reqBody.id })
  } else {
    return client('build').update(reqBody).where({ id: reqBody.id })
  }
}

async function updateMachiningOrder(reqBody, latest_token_id, updateOriginalTokenId) {
  const updated_at = new Date().toISOString()
  reqBody.updated_at = updated_at
  reqBody.latest_token_id = latest_token_id
  if (updateOriginalTokenId) {
    return client('machiningorders')
      .update({ status: reqBody.status, updated_at, latest_token_id, original_token_id: latest_token_id })
      .where({ id: reqBody.id })
  } else {
    return client('machiningorders').update(reqBody).where({ id: reqBody.id })
  }
}

async function updatePart(reqBody, latest_token_id, updateOriginalTokenId) {
  const updated_at = new Date().toISOString()
  reqBody.updated_at = updated_at
  reqBody.latest_token_id = latest_token_id
  if (updateOriginalTokenId) {
    return client('parts')
      .update({
        ...reqBody,
        metadata: JSON.stringify(reqBody.metadata),
        certifications: JSON.stringify(reqBody.certifications),
        updated_at,
        latest_token_id,
        original_token_id: latest_token_id,
      })
      .where({ id: reqBody.id })
  } else {
    return client('parts')
      .update({
        ...reqBody,
        metadata: JSON.stringify(reqBody.metadata),
        certifications: JSON.stringify(reqBody.certifications),
      })
      .where({ id: reqBody.id })
  }
}

async function getAttachment(id) {
  return client('attachments').select(['id', 'filename', 'binary_blob']).where({ id })
}

async function addRecipe(recipe) {
  return client('recipes').insert(recipe).returning('*')
}

async function getRecipeByIDs(ids) {
  return client('recipes').select('*').whereIn('id', ids)
}

async function getPartByIDs(ids) {
  return client('parts').select('*').whereIn('id', ids)
}

async function getRecipeByIDdb(id) {
  return client('recipes').select('*').where({ id })
}

async function getRecipes(limit, page) {
  if (limit && page) {
    return client('recipes')
      .select()
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit) {
    return client('recipes').select().orderBy('created_at', 'desc').limit(parseInt(limit))
  } else if (page) {
    return client('recipes')
      .select()
      .orderBy('created_at', 'desc')
      .offset(parseInt(page) - 1)
  } else {
    return client('recipes').select().orderBy('created_at', 'desc')
  }
}

async function getRecipeCount() {
  return client('recipes').count('*')
}

async function getParts() {
  return client('parts').select()
}

async function getPartById(id) {
  return client('parts').select().where({ id })
}

async function getPartsByOrderId(order_id) {
  return client('parts').select().where({ order_id })
}

async function getAllRecipeTransactions(recipe_id) {
  return client.from('recipe_transactions').select().where({ recipe_id })
}

const insertAttachment = async (name, fileData) => {
  return client('attachments').insert({ filename: name, binary_blob: fileData }).returning(['id', 'filename'])
}

async function getAttachmentByIdDb(id) {
  return client('attachments').select(['filename', 'binary_blob']).where({ id })
}

async function getAttachments() {
  return client('attachments').select(['id', 'filename', 'binary_blob'])
}

async function getRecipe(id) {
  return client('recipes')
    .join('attachments', 'recipes.image_attachment_id', 'attachments.id')
    .select()
    .where({ 'recipes.id': id })
}

async function getOrder(id) {
  return client('orders').select().where({ id })
}

async function getOrderTransactions(order_id, type) {
  return client('order_transactions').select().where({ order_id, type })
}

async function getPartTransactions(part_id, type) {
  return client('part_transactions').select().where({ part_id, type })
}

async function getBuildTransactions(build_id, type) {
  return client('build_transactions').select().where({ build_id, type })
}

async function getMachiningOrderTransactions(machining_order_id, type) {
  return client('machining_order_transactions').select().where({ machining_order_id, type })
}

async function getBuildTransactionsById(transaction_id, build_id, type) {
  return client('build_transactions').select().where({ build_id, type, id: transaction_id })
}

async function getMachiningOrderTransactionsById(transaction_id, machining_order_id, type) {
  return client('machining_order_transactions').select().where({ machining_order_id, type, id: transaction_id })
}

async function getOrderTransactionsById(transaction_id, order_id, type) {
  return client('order_transactions').select().where({ order_id, type, id: transaction_id })
}

async function getPartTransactionsById(transaction_id, part_id, type) {
  return client('part_transactions').select().where({ part_id, type, id: transaction_id })
}

async function getOrders(limit, page) {
  if (limit && page) {
    return client('orders')
      .select()
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit) {
    return client('orders').select().orderBy('created_at', 'desc').limit(parseInt(limit))
  } else if (page) {
    return client('orders')
      .select()
      .orderBy('created_at', 'desc')
      .offset(parseInt(page) - 1)
  } else {
    return client('orders').select().orderBy('created_at', 'desc')
  }
}

async function getOrdersByDateRange(supplier) {
  const months = 6
  const targetDate = new Date()
  targetDate.setMonth(targetDate.getMonth() - months)
  const formattedDate = targetDate.toISOString()

  let query = client('orders').select().where('created_at', '>=', formattedDate).orderBy('created_at', 'desc')

  if (supplier) {
    query = query.where('business_partner_code', '=', supplier)
  }
  try {
    console.log('DB query = ', query)
    const orders = await query
    return orders
  } catch (err) {
    console.error(err)
    return []
  }
}

async function getOrderCount() {
  return client('orders').count('*')
}

async function getMachiningOrderCount() {
  return client('machiningorders').count('*')
}

async function getOrdersByExternalId(externalId) {
  return client('orders').select().where({ external_id: externalId })
}

async function getMachiningOrdersByExternalId(externalId) {
  return client('machiningorders').select().where({ external_id: externalId })
}

async function getOrdersBySearchQuery(searchQuery) {
  let result = await client('orders').select().whereILike('external_id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  result = await client('orders').whereRaw('LOWER(id::text) LIKE LOWER(?)', [`%${searchQuery}%`])
  if (result.length !== 0) {
    return result
  }
  let build = await getBuildsBySearchQuery(searchQuery)
  let parts = []
  let orders = []
  if (build.length !== 0) {
    for (let index = 0; index < build.length; index++) {
      let [result] = await getPartsByBuildId(build[index].id)
      parts.push(result)
    }
    for (let index = 0; index < parts.length; index++) {
      let [result] = await getOrder(parts[index].order_id)
      orders.push(result)
    }
  }
  let part = await getPartsBySearchQuery(searchQuery)
  if (part.length !== 0) {
    for (let index = 0; index < part.length; index++) {
      let [result] = await getOrder(part[index].order_id)
      orders.push(result)
    }
  }
  return orders
}

async function getRecipesBySearchQuery(searchQuery) {
  let result = await client('recipes').select().whereILike('external_id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  result = await client('recipes').whereRaw('LOWER(id::text) LIKE LOWER(?)', [`%${searchQuery}%`])
  if (result.length !== 0) {
    return result
  }
  return client('recipes').select().whereILike('name', `%${searchQuery}%`)
}

async function getNotificationsBySearchQuery(searchQuery) {
  return client('notifications')
    .select()
    .distinctOn('order_id')
    .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
    .whereILike('order_external_id', `%${searchQuery}%`)
}

async function getBuildsBySearchQuery(searchQuery) {
  let result = await client('build').select().whereILike('external_id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  return client('build').whereRaw('LOWER(id::text) LIKE LOWER(?)', [`%${searchQuery}%`])
}

async function getMachiningOrdersBySearchQuery(searchQuery) {
  let result = await client('machiningorders').select().whereILike('external_id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  const [buildResult] = await client('build').select().whereILike('external_id', `%${searchQuery}%`)
  const [partResult] = await client('parts').whereRaw('LOWER(build_id::text) LIKE LOWER(?)', [`%${buildResult.id}%`])
  result = await client('machiningorders').whereRaw('LOWER(part_id::text) LIKE LOWER(?)', [`%${partResult.id}%`])
  if (result.length !== 0) {
    return result
  }
  return client('machiningorders').whereRaw('LOWER(id::text) LIKE LOWER(?)', [`%${searchQuery}%`])
}

async function getPartsBySearchQuery(searchQuery) {
  return client('parts').whereRaw('LOWER(id::text) LIKE LOWER(?)', [`%${searchQuery}%`])
}

async function getRecipesByExternalId(externalId) {
  return client('recipes').select().where({ external_id: externalId })
}

async function insertNotification(notification) {
  return client('notifications').insert(notification).returning('*')
}

async function insertRecipeTransaction(id, status, type, token_id) {
  return client('recipe_transactions')
    .insert({
      recipe_id: id,
      status,
      type,
      token_id,
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function updateNotification(read, del, id) {
  return client('notifications').update({ read, delete: del }).where({ id })
}

async function getNotificationsCount(read, groupyByOrder) {
  if (read && groupyByOrder) {
    return client('notifications').select().where({ read, delete: false }).groupBy('order_id').count('*')
  } else if (read) {
    return client('notifications').select().where({ read, delete: false }).count('*')
  } else if (groupyByOrder) {
    return client('notifications').select().where({ delete: false }).groupBy('order_id').count('*')
  } else {
    return client('notifications').select().where({ delete: false }).count('*')
  }
}

async function getNotificationsByOrderId(order_id, read, id, del) {
  return client('notifications')
    .select()
    .where({ order_id, read, delete: del })
    .whereNot({ id })
    .orderBy('created_at', 'desc')
}

async function getNotifications(limit, page, read) {
  if (limit && page && read) {
    return client('notifications')
      .select()
      .distinctOn('order_id')
      .where({ read, delete: false })
      .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit && page) {
    return client('notifications')
      .select()
      .distinctOn('order_id')
      .where({ delete: false })
      .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit && read) {
    return client('notifications')
      .select()
      .where({ read, delete: false })
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
  } else if (page && read) {
    return client('notifications')
      .select()
      .distinctOn('order_id')
      .where({ read, delete: false })
      .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
      .offset(parseInt(page) - 1)
  } else if (limit) {
    return client('notifications')
      .select()
      .where({ delete: false })
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
  } else if (page) {
    return client('notifications')
      .select()
      .where({ delete: false })
      .distinctOn('order_id')
      .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
      .offset(parseInt(page) - 1)
  } else if (read) {
    return client('notifications')
      .select()
      .distinctOn('order_id')
      .where({ read, delete: false })
      .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
  } else {
    return client('notifications')
      .select()
      .where({ delete: false })
      .distinctOn('order_id')
      .orderBy([{ column: 'order_id' }, { column: 'created_at', order: 'desc' }])
  }
}

async function insertOrderTransaction(id, type, status, token_id) {
  return client('order_transactions')
    .insert({
      order_id: id,
      status,
      type,
      token_id,
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function updateOrderTransaction(id, token_id) {
  return client('order_transactions').update({ token_id }).where({ id })
}

async function updateBuildTransaction(id, token_id) {
  return client('build_transactions').update({ token_id }).where({ id })
}

async function updateMachiningOrderTransaction(id, token_id) {
  return client('machining_order_transactions').update({ token_id }).where({ id })
}

async function updatePartTransaction(id, token_id) {
  return client('part_transactions').update({ token_id }).where({ id })
}

async function insertPartTransaction(id, type, status, token_id) {
  return client('part_transactions')
    .insert({
      part_id: id,
      status,
      type,
      token_id,
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function insertBuildTransaction(id, type, status, token_id) {
  return client('build_transactions')
    .insert({
      build_id: id,
      status,
      type,
      token_id,
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function insertMachiningOrderTransaction(id, type, status, token_id) {
  return client('machining_order_transactions')
    .insert({
      machining_order_id: id,
      status,
      type,
      token_id,
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function removeRecipe(id) {
  return client('recipes').delete().where({ id })
}

async function removeOrder(id) {
  return client('orders').delete().where({ id })
}

async function removePart(id) {
  return client('parts').delete().where({ id })
}

async function removeMachiningOrder(id) {
  return client('machiningorders').delete().where({ id })
}

async function removeBuild(id) {
  return client('build').delete().where({ id })
}

async function removeTransactionOrder(id) {
  return client('order_transactions').delete().where({ id })
}

async function removeTransactionBuild(id) {
  return client('build_transactions').delete().where({ id })
}

async function removeTransactionMachiningOrder(id) {
  return client('machining_order_transactions').delete().where({ id })
}

async function removeTransactionPart(id) {
  return client('part_transactions').delete().where({ id })
}

async function removeTransactionRecipe(id) {
  return client('recipe_transactions').delete().where({ id })
}

async function getRecipeTransaction(id, recipe_id) {
  return client('recipe_transactions').select().where({ id, recipe_id })
}

async function updateRecipeTransactions(id, token_id) {
  const updated_at = new Date().toISOString()
  return client('recipe_transactions').update({ token_id, updated_at }).where({ id })
}
async function updateRecipe(id, latest_token_id, updateOriginalTokenId) {
  const updated_at = new Date().toISOString()
  if (updateOriginalTokenId) {
    return client('recipes').update({ latest_token_id, original_token_id: latest_token_id, updated_at }).where({ id })
  } else {
    return client('recipes').update({ latest_token_id, updated_at }).where({ id })
  }
}

async function getBuild() {
  return client('build').select()
}

async function getMachiningOrder(limit, page) {
  if (limit && page) {
    return client('machiningorders')
      .select()
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit) {
    return client('machiningorders').select().orderBy('created_at', 'desc').limit(parseInt(limit))
  } else if (page) {
    return client('machiningorders')
      .select()
      .orderBy('created_at', 'desc')
      .offset(parseInt(page) - 1)
  } else {
    return client('machiningorders').select().orderBy('created_at', 'desc')
  }
}

async function getPartIdsByBuildId(build_id) {
  return client('parts').select('id').where({ build_id })
}

async function getPartsByBuildId(build_id) {
  return client('parts').select().where({ build_id })
}

async function getBuildById(id) {
  return client('build').select().where({ id })
}

async function getMachiningOrderById(id) {
  return client('machiningorders').select().where({ id })
}

async function getMachiningOrderByPartId(partId) {
  return client('machiningorders').select().where({ part_id: partId })
}

async function checkDuplicateExternalId(external_id, tableName) {
  return client(tableName).select('external_id').where({ external_id })
}

async function checkDuplicateTaskNumber(taskNumber, tableName) {
  return client(tableName).select('task_id').where({ task_id: taskNumber })
}

module.exports = {
  client,
  getRecipe,
  getRecipeTransaction,
  insertRecipeTransaction,
  getAllRecipeTransactions,
  postOrderDb,
  getAttachment,
  addRecipe,
  getRecipes,
  insertAttachment,
  getRecipeByIDs,
  getRecipeByIDdb,
  getAttachmentByIdDb,
  getOrder,
  insertOrderTransaction,
  getAttachments,
  getOrders,
  getOrderTransactions,
  getOrderTransactionsById,
  updateOrder,
  removeTransactionOrder,
  updateRecipeTransactions,
  removeTransactionRecipe,
  updateRecipe,
  getBuild,
  getBuildById,
  postBuildDb,
  postPartDb,
  getOrdersByExternalId,
  getRecipesByExternalId,
  getPartIdsByBuildId,
  insertBuildTransaction,
  updateOrderTransaction,
  updateBuildTransaction,
  getPartsByBuildId,
  updateBuild,
  removeTransactionBuild,
  getBuildTransactions,
  getBuildTransactionsById,
  getParts,
  getPartById,
  updatePart,
  insertPartTransaction,
  updatePartTransaction,
  removeTransactionPart,
  getPartTransactions,
  getPartTransactionsById,
  getPartsByOrderId,
  getPartByIDs,
  checkDuplicateExternalId,
  getOrdersByDateRange,
  getOrderCount,
  getRecipeCount,
  getOrdersBySearchQuery,
  getRecipesBySearchQuery,
  getBuildsBySearchQuery,
  getPartsBySearchQuery,
  postMachiningOrderDb,
  getMachiningOrdersBySearchQuery,
  getMachiningOrder,
  getMachiningOrderById,
  insertMachiningOrderTransaction,
  removeTransactionMachiningOrder,
  updateMachiningOrderTransaction,
  updateMachiningOrder,
  getMachiningOrderTransactions,
  getMachiningOrderTransactionsById,
  getMachiningOrderByPartId,
  checkDuplicateTaskNumber,
  getMachiningOrdersByExternalId,
  getMachiningOrderCount,
  insertNotification,
  getNotifications,
  getNotificationsCount,
  getNotificationsByOrderId,
  updateNotification,
  getNotificationsBySearchQuery,
  removeRecipe,
  removeOrder,
  removePart,
  removeBuild,
  removeMachiningOrder,
}
