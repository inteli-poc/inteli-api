const { stub } = require('sinon')
const { expect } = require('chai')

const db = require('../../../../db')
const { mapOrderData } = require('../helpers')
const recipesExample = require('./__fixtures__/recipes.json')
const { NoTokenError, NothingToProcess } = require('../../../../utils/errors')

const payload = {
  items: recipesExample.map((el) => el.id),
  status: 'Submitted',
  requiredBy: '2022-06-13T11:20:35.466Z',
  selfAddress: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  transaction: {
    id: '50000000-e000-1000-5500-000000000001',
  },
}

describe('map order data helper function', () => {
  let output
  let stubs = {}

  beforeEach(async () => {
    stubs.getRecipeIds = stub(db, 'getRecipeByIDs').resolves(recipesExample)
  })

  afterEach(() => {
    stubs.getRecipeIds.restore()
  })

  describe('if one of the recipes does not have a token id', () => {
    beforeEach(async () => {
      try {
        output = await mapOrderData(payload)
      } catch (e) {
        output = e
      }
    })

    it('throws NoTokenError', () => {
      expect(output).to.be.an.instanceOf(NoTokenError)
      expect(output.code).to.equal(500)
      expect(output.message).to.equal('Token for recipes has not been created yet.')
    })
  })

  describe('if data does not contain any recipe items', () => {
    beforeEach(async () => {
      try {
        output = await mapOrderData({ ...payload, items: [] })
      } catch (e) {
        output = e
      }
    })

    it('throws NothingToProcess', () => {
      expect(output).to.be.an.instanceOf(NothingToProcess)
      expect(output.code).to.equal(400)
      expect(output.message).to.equal('This request requires tokens to be burned.')
    })
  })

  it('maps and formats data', async () => {
    stubs.getRecipeIds.resolves([recipesExample[0]])
    output = await mapOrderData(payload)
    expect(output).to.deep.equal({
      inputs: [20],
      outputs: [
        {
          roles: {
            Owner: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            Buyer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            Supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          },
          metadata: {
            20: {
              type: 'TOKEN_ID',
              value: 20,
            },
            type: {
              type: 'LITERAL',
              value: 'ORDER',
            },
            status: {
              type: 'LITERAL',
              value: 'Submitted',
            },
            requiredBy: {
              type: 'LITERAL',
              value: '2022-06-13T11:20:35.466Z',
            },
            transactionId: {
              type: 'LITERAL',
              value: '50000000e00010005500000000000001',
            },
          },
        },
        {
          roles: {
            Owner: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            Buyer: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
            Supplier: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
          },
          metadata: {
            type: {
              type: 'LITERAL',
              value: 'RECIPE',
            },
          },
          parent_index: 0,
        },
      ],
    })
  })
})
