const nock = require('nock')
const { expect } = require('chai')
const { stub } = require('sinon')

const { BadRequestError, NotFoundError } = require('../../../../utils/errors')
const { client } = require('../../../../db')
const { transaction } = require('../')

const payload = {
  params: {
    id: 'recipe-id',
  },
  token: 'some-auth-token',
}

const recipeExample = {
  id: 1,
  price: '99.99',
  material: 'iron',
  supplier: 'supplier-address',
}

const submitTransaction = async (req) => {
  try {
    return await transaction.create(req)
  } catch (err) {
    return err
  }
}

describe('recipe controller', () => {
  let response
  let insertTransactionStub = stub().returnsThis()
  let selectStub = stub().returnsThis()
  let whereRecipeStub = stub().resolves([recipeExample])

  before(async () => {
    nock('http://localhost:3001').post('/v3/run-process').reply(200, [20])
    stub(client, 'from').callsFake(() => {
      return {
        select: selectStub,
        returning: stub().resolves([{ id: 'transaction-uuid' }]),
        insert: insertTransactionStub,
        where: whereRecipeStub,
      }
    })
  })

  afterEach(() => nock.cleanAll)

  describe('transactions /create', () => {
    describe('if req.params.id is not provided', () => {
      beforeEach(async () => {
        response = await submitTransaction({ params: {} })
      })

      it('throws validation error', () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('missing [id] param from request')
      })

      it('does not perform any database calls and does not create transaction', () => {
        expect(whereRecipeStub.calledOnce).to.equal(false)
        expect(insertTransactionStub.calledOnce).to.equal(false)
      })
    })

    describe('if recipe does not exists in local db', () => {
      beforeEach(async () => {
        whereRecipeStub = stub().resolves([])
        response = await submitTransaction({ params: { id: 1 } })
      })

      it('throws not found error along with the message', () => {
        expect(response).to.be.an.instanceOf(NotFoundError)
        expect(response.message).to.be.equal('recipe not found')
      })

      it('does not create a transaction', () => {
        expect(insertTransactionStub.calledOnce).to.equal(false)
      })
    })

    describe('happy path', () => {
      beforeEach(async () => {
        nock('http://localhost:3001').post('/v3/run-process').reply(200, [20])
        whereRecipeStub = stub().resolves([recipeExample])
        response = await submitTransaction(payload)
      })

      it('validates req params', () => {})

      it('checks if recipe is in local db', () => {
        expect(whereRecipeStub.getCall(0).args[0]).to.deep.equal({ id: 'recipe-id' })
      })

      it('inserts new transaction to local db', async () => {
        expect(insertTransactionStub.getCall(0).args).to.be.deep.equal([
          {
            recipe_id: 'recipe-id',
            status: 'submitted',
            token_id: 20,
          },
        ])
      })

      it('returns 200 along with the transaction id', () => {
        expect(response).to.deep.equal({
          status: 200,
          message: 'transaction transaction-uuid has been created',
        })
      })
    })
  })
})
