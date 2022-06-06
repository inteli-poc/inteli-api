const db = require('../../app/db')
// This file should seed all the required info for all integration tests and local developmet

const cleanup = async () => {
  await db.client('recipe_transactions').del()
  await db.client('recipes').del()
  await db.client('attachments').del()
}
const attachmentId = '10000000-0000-1000-8000-000000000000'

module.exports = async () => {
  await cleanup() // no need to export, it call it anyway...

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
