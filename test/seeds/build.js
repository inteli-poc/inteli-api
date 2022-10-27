const { client } = require('../../app/db')

const cleanup = async () => {
  await client.raw('TRUNCATE TABLE build, recipes, attachments, parts CASCADE')
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
      supplier: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
      owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
    },
  ])

  await client('parts').insert([
    {
      id: '7989218f-fdc3-4f4c-a772-bae5f9e06994',
      supplier: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
      recipe_id: '36345f4f-0000-42e2-83f9-79e2e195e000',
      certifications: JSON.stringify([{ description: 'foobar3000' }]),
      metadata: null,
      required_by: '2022-09-23T09:30:51.190Z',
      price: 1100,
      quantity: 1,
      currency: 'some-currency',
      delivery_terms: 'some-delivery-terms',
      delivery_address: 'some-delivery-address',
      line_text: 'some-line-text',
      export_classification: 'some-export-classification',
      unit_of_measure: 'some-unit-of-measure',
      price_type: 'some-price-type',
      confirmed_receipt_date: '2022-09-23T09:30:51.190Z',
      description: 'some-description',
    },
  ])
}

module.exports = {
  cleanup,
  seed,
}
