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
    })
    .returning(['id', 'status'])
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

async function insertRecipeTransaction(id) {
  return client('recipe_transactions')
    .insert({
      recipe_id: id,
      status: 'Submitted',
      type: 'Creation',
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function insertOrderTransaction(id) {
  return client('order_transactions')
    .insert({
      order_id: id,
      status: 'Submitted',
      type: 'Submission',
    })
    .returning(['id', 'status', 'created_at'])
    .then((t) => t[0])
}

async function getRecipeTransaction(id, recipe_id) {
  return client('recipe_transactions').select().where({ id, recipe_id })
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
}
