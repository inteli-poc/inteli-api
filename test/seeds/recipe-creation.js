const db = require('../../app/db')
const { client } = require('../../app/db')
// This file should seed all the required info for all integration tests and local developmet

const cleanup = async () => {
  await client.raw('TRUNCATE recipe_transactions, recipes, attachments CASCADE')
}
const attachmentId = '10000000-0000-1000-8000-000000000000'

const seed = async () => {
  await cleanup()

  await db.client('attachments').insert([
    {
      id: attachmentId,
      filename: 'foo.jpg',
      binary_blob: 9999999,
    },
    {
      id: '00000000-0000-1000-8000-000000000001',
      filename: 'foo1.jpg',
      binary_blob: 9999999,
    },
  ])
  const [recipe] = await db
    .client('recipes')
    .insert({
      id: '00000000-0000-1000-8000-000000000001',
      external_id: 'TEST-externalId',
      name: 'TEST-name',
      image_attachment_id: attachmentId,
      material: 'TEST-material',
      alloy: 'TEST-alloy',
      price: '99.99',
      required_certs: JSON.stringify([{ description: 'TEST-certificate' }]),
      supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    })
    .returning(['id'])

  await db.client('recipe_transactions').insert({
    recipe_id: recipe.id,
    type: 'Creation',
    status: 'InBlock',
    created_at: '2020-10-10',
  })

  await db.client('recipe_transactions').insert({
    recipe_id: recipe.id,
    type: 'Creation',
    status: 'Submitted',
    created_at: '2021-10-10',
  })
}

module.exports = {
  cleanup,
  seed,
}
