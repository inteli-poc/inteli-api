const { client } = require('../../app/db')

const cleanup = async () => {
  await client('orders').del()
  await client('recipes').del()
  await client('attachments').del()
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
      id: '10000000-0000-1000-8000-000000000000',
      external_id: 'foobar3000',
      name: 'foobar3000',
      image_attachment_id: '00000000-0000-1000-8000-000000000000',
      material: 'foobar3000',
      alloy: 'foobar3000',
      price: 'foobar3000',
      required_certs: JSON.stringify([{ description: 'foobar3000' }]),
      supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    },
  ])

  await client('recipes').insert([
    {
      id: '10000000-0000-1000-9000-000000000000',
      external_id: 'supplier3000',
      name: 'supplier3000',
      image_attachment_id: '00000000-0000-1000-8000-000000000000',
      material: 'supplier3000',
      alloy: 'supplier3000',
      price: 'supplier3000',
      required_certs: JSON.stringify([{ description: 'supplier3000' }]),
      supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    },
  ])
}

module.exports = {
  cleanup,
  seed,
}
