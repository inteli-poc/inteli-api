module.exports = {
  recipeId: 'RECIPE00-0000-1000-8000-000000000000',
  recipeExample: {
    id: 'RECIPE00-9000-1000-8000-000000000000',
    price: '99.99',
    material: 'iron',
    supplier: 'supplier-address',
  },
  transactionsExample: [
    {
      id: 'TRASACTI-0000-1000-8000-000000000000',
      recipe_id: 'RECIPE00-0000-1000-8000-000000000000',
      token_id: 2,
      status: 'Accepted',
      created_at: new Date('2022-05-23T11:04:29.316Z'),
      type: 'Creation',
    },
    {
      id: 'TRASACTI-0000-2000-8000-000000000000',
      recipe_id: 'RECIPE00-0000-1000-8000-00000000000',
      token_id: 1,
      status: 'Accepted',
      created_at: new Date('2022-05-23T13:04:29.316Z'),
      type: 'Creation',
    },
  ],
  listResponse: [
    {
      id: 'TRASACTI-0000-1000-8000-000000000000',
      status: 'Accepted',
      submittedAt: '2022-05-23T11:04:29.316Z',
    },
    {
      id: 'TRASACTI-0000-2000-8000-000000000000',
      status: 'Accepted',
      submittedAt: '2022-05-23T13:04:29.316Z',
    },
  ],
}
