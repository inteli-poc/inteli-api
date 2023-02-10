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
      .orderBy('id')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit) {
    return client('recipes').select().orderBy('id').limit(parseInt(limit))
  } else if (page) {
    return client('recipes')
      .select()
      .orderBy('id')
      .offset(parseInt(page) - 1)
  } else {
    return client('recipes').select()
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

async function getBuildTransactionsById(transaction_id, build_id, type) {
  return client('build_transactions').select().where({ build_id, type, id: transaction_id })
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
      .orderBy('id')
      .limit(parseInt(limit))
      .offset((parseInt(page) - 1) * limit)
  } else if (limit) {
    return client('orders').select().orderBy('id').limit(parseInt(limit))
  } else if (page) {
    return client('orders')
      .select()
      .orderBy('id')
      .offset(parseInt(page) - 1)
  } else {
    return client('orders').select()
  }
}

async function getOrderCount() {
  return client('orders').count('*')
}

async function getOrdersByExternalId(externalId) {
  return client('orders').select().where({ external_id: externalId })
}

async function getOrdersBySearchQuery(searchQuery) {
  let result = client('orders').select().whereILike('external_id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  return client('orders').select().whereILike('id', `%${searchQuery}%`)
}

async function getRecipesBySearchQuery(searchQuery) {
  let result = client('recipes').select().whereILike('external_id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  result = client('recipes').select().whereILike('id', `%${searchQuery}%`)
  if (result.length !== 0) {
    return result
  }
  return client('recipes').select().whereILike('name', `%${searchQuery}%`)
}

async function getRecipesByExternalId(externalId) {
  return client('recipes').select().where({ external_id: externalId })
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

async function removeTransactionOrder(id) {
  return client('order_transactions').delete().where({ id })
}

async function removeTransactionBuild(id) {
  return client('build_transactions').delete().where({ id })
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

async function getPartIdsByBuildId(build_id) {
  return client('parts').select('id').where({ build_id })
}

async function getPartsByBuildId(build_id) {
  return client('parts').select().where({ build_id })
}

async function getBuildById(id) {
  return client('build').select().where({ id })
}

async function checkDuplicateExternalId(external_id, tableName) {
  return client(tableName).select('external_id').where({ external_id })
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
  getOrderCount,
  getRecipeCount,
  getOrdersBySearchQuery,
  getRecipesBySearchQuery,
}
