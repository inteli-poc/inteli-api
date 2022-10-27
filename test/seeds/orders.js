const { client } = require('../../app/db')

const cleanup = async () => {
  await client.raw('TRUNCATE TABLE orders, recipes, attachments CASCADE')
}

const seed = async () => {
  await cleanup()

  await client('attachments').insert([
    {
      id: '00000000-0000-1000-8000-000000000000',
      filename: 'foo.jpg',
      binary_blob: 9999999,
    },
  ])

  await client('recipes').insert([
    {
      id: '36345f4f-0000-42e2-83f9-79e2e195e000',
      external_id: '045240',
      name: 'Magical Part 1',
      image_attachment_id: '00000000-0000-1000-8000-000000000000',
      material: 'material',
      alloy: 'alloy',
      latest_token_id: 1,
      price: '999.66',
      required_certs: JSON.stringify([{ description: 'foobar3000' }]),
      supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    },
  ])
}

module.exports = {
  cleanup,
  seed,
}
