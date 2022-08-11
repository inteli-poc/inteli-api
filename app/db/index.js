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
      required_by: reqBody.requiredBy,
      items: reqBody.items,
      buyer: reqBody.buyerAddress,
      status: reqBody.status,
      external_id: reqBody.externalId,
    })
    .returning(['id', 'status'])
}

async function updateOrder(reqBody, latest_token_id, updateOriginalTokenId) {
  const updated_at = new Date().toISOString()
  if (updateOriginalTokenId) {
    return client('orders')
      .update({ status: reqBody.status, updated_at, latest_token_id, original_token_id: latest_token_id })
      .where({ id: reqBody.id })
  } else {
    return client('orders').update({ status: reqBody.status, updated_at, latest_token_id }).where({ id: reqBody.id })
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

async function getRecipeByIDdb(id) {
  return client('recipes').select('*').where({ id })
}

async function getRecipes() {
  return client('recipes').select()
}

async function getAllRecipeTransactions(recipe_id) {
  return client.from('recipe_transactions').select().where({ recipe_id })
}

const insertAttachment = async (name, fileData) => {
  return await client('attachments').insert({ filename: name, binary_blob: fileData }).returning(['id', 'filename'])
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
async function getOrderTransactionsById(transaction_id, order_id, type) {
  return client('order_transactions').select().where({ order_id, type, id: transaction_id })
}

async function getOrders() {
  return client('orders').select()
}

async function getOrdersByExternalId(externalId) {
  return client('orders').select().where({ external_id: externalId })
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

async function removeTransactionOrder(id) {
  return client('order_transactions').delete().where({ id })
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
  getOrdersByExternalId,
  getRecipesByExternalId,
}
