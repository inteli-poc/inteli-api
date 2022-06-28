const nock = require('nock')
const { expect } = require('chai')
const { stub } = require('sinon')
const orderController = require('../index')
const db = require('../../../../db')
const identityService = require('../../../services/identityService')
const { BadRequestError, NotFoundError, IdentityError, NoTokenError } = require('../../../../utils/errors')
const { DSCP_API_HOST, DSCP_API_PORT } = require('../../../../env')

const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`
const recipeExamples = [
  {
    id: '50000000-0000-1000-5500-000000000001',
    latest_token_id: 20,
    supplier: 'supplier-address',
  },
  {
    id: '50000000-0000-1000-5600-000000000001',
    latest_token_id: null,
    supplier: 'supplier-address',
  },
  {
    id: '50000000-0000-1000-5700-000000000001',
    latest_token_id: 2,
    supplier: 'supplier-address',
  },
]
const createTransaction = async (req) => {
  try {
    return await orderController.transaction.create(req)
  } catch (err) {
    return err
  }
}

const postOrder = async (req) => {
  try {
    return await orderController.post(req)
  } catch (err) {
    return err
  }
}

describe('order controller', () => {
  let stubs = {}
  let response
  let runProcessBody
  let runProcessReq

  before(async () => {
    runProcessReq = nock(dscpApiUrl)
      .post('/v3/run-process', (body) => {
        runProcessBody = body
        return true
      })
      .reply(200, [20])
  })

  afterEach(() => {
    stubs = {}
    nock.cleanAll()
  })

  describe('/order - post endpoint for creating order in local db', () => {
    beforeEach(async () => {
      stubs.getRecipeIds = stub(db, 'getRecipeByIDs').resolves(recipeExamples)
      stubs.identityByAlias = stub(identityService, 'getMemberByAlias').resolves({ address: 'supplier-address' })
      stubs.identityByAddress = stub(identityService, 'getMemberByAddress').resolves({ alias: 'self-alias' })
      stubs.identitySelf = stub(identityService, 'getMemberBySelf').resolves('self-address')
      stubs.insertOrder = stub(db, 'postOrderDb').resolves([
        {
          id: 'order-id',
          items: recipeExamples.map((el) => el.id),
        },
      ])
    })

    afterEach(() => {
      stubs.getRecipeIds.restore()
      stubs.identityByAlias.restore()
      stubs.identityByAddress.restore()
      stubs.identitySelf.restore()
      stubs.insertOrder.restore()
    })

    describe('if req.body is missing', () => {
      beforeEach(async () => {
        response = await postOrder({ key: 'req without a body key' })
      })

      it('throws BadRequestError and returns 400', () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('Bad Request: missing req.body')
      })

      it('and does not make any calls to the identity service', () => {
        expect(stubs.identityByAlias.calledOnce).to.equal(false)
        expect(stubs.identitySelf.calledOnce).to.equal(false)
      })

      it('and does not attempt to persist order', () => {
        expect(stubs.insertOrder.calledOnce).to.equal(false)
      })
    })

    describe('if identity service is unavailable or returned an error', () => {
      beforeEach(async () => {
        stubs.identityByAlias.restore()
        stubs.identitySelf.throws('some error - identity self')
        stubs.identityByAlias.rejects('some error - identity alias')
        response = await postOrder({
          body: {
            supplier: 'supplier-alias',
            description: 'some description - test',
            requiredBy: '2022-06-17T07:31:37.602Z',
            items: recipeExamples.map((el) => el.id),
          },
        })
      })

      it('and does not call insert order db method', () => {
        expect(stubs.insertOrder.calledOnce).to.equal(false)
      })
    })

    describe('when payload validation fails', () => {
      describe('due to recipes not found', () => {
        beforeEach(async () => {
          stubs.insertOrder.restore()
          stubs.getRecipeIds.resolves([])
          response = await postOrder({
            body: {
              supplier: 'supplier-alias',
              description: 'some description - test',
              requiredBy: '2022-06-17T07:31:37.602Z',
              items: recipeExamples.map((el) => el.id),
            },
          })
        })

        afterEach(() => {
          stubs.getRecipeIds.restore()
        })

        it('throws NotFoundError and returns 400 with the message', () => {
          expect(response).to.be.an.instanceOf(BadRequestError)
          expect(response.message).to.be.equal('Bad Request: recipe not found')
        })

        it('does not attempt to insert order', () => {
          expect(stubs.insertOrder.calledOnce).to.equal(false)
        })
      })

      describe('due to mismatch of supplier that is in req.body', () => {
        beforeEach(async () => {
          stubs.getRecipeIds.resolves([{ supplier: 'a' }, { supplier: 'a' }, { supplier: 'a' }])
          stubs.identityByAlias.returns('a-missmatched-alias')

          response = await postOrder({
            body: {
              supplier: 'supplier-alias-mismatch',
              description: 'some description - test',
              requiredBy: '2022-06-17T07:31:37.602Z',
              items: recipeExamples.map((el) => el.id),
            },
          })
        })

        afterEach(() => {
          stubs.getRecipeIds.restore()
        })

        it('throws BadRequestError and returns 400 with the message', () => {
          expect(response).to.be.an.instanceOf(BadRequestError)
          expect(response.message).to.be.equal('Bad Request: invalid supplier')
        })

        it('does not attempt to insert order', () => {
          expect(stubs.insertOrder.calledOnce).to.equal(false)
        })
      })
    })

    describe('if persisting order fails', () => {
      beforeEach(async () => {
        stubs.getRecipeIds.resolves(recipeExamples)
        stubs.insertOrder.rejects('some error - insert order')

        response = await postOrder({
          body: {
            supplier: 'supplier-alias',
            description: 'some description - test',
            requiredBy: '2022-06-17T07:31:37.602Z',
            items: recipeExamples.map((el) => el.id),
          },
        })
      })

      it('returns insert error and allows middleware to handle the response', () => {
        expect(response.toString()).to.be.equal('some error - insert order')
      })
    })

    describe('happy path', () => {
      beforeEach(async () => {
        stubs.getRecipeIds.resolves([...recipeExamples])

        response = await postOrder({
          body: {
            supplier: 'supplier-alias',
            description: 'some description - test',
            requiredBy: '2022-06-17T07:31:37.602Z',
            items: recipeExamples.map((el) => el.id),
          },
        })
      })

      afterEach(() => {
        stubs.getRecipeIds.restore()
      })

      it('gets aliases from identity service', () => {
        expect(stubs.identityByAlias.getCall(0).args[0]).to.deep.equal({
          body: {
            supplier: 'supplier-alias',
            description: 'some description - test',
            requiredBy: '2022-06-17T07:31:37.602Z',
            items: [
              '50000000-0000-1000-5500-000000000001',
              '50000000-0000-1000-5600-000000000001',
              '50000000-0000-1000-5700-000000000001',
            ],
          },
        })
        expect(stubs.identityByAddress.getCall(0).args[0]).to.deep.equal({
          body: {
            supplier: 'supplier-alias',
            description: 'some description - test',
            requiredBy: '2022-06-17T07:31:37.602Z',
            items: [
              '50000000-0000-1000-5500-000000000001',
              '50000000-0000-1000-5600-000000000001',
              '50000000-0000-1000-5700-000000000001',
            ],
          },
        })
      })

      it('retrieves self address', () => {
        expect(stubs.identitySelf.getCall(0).args[0]).to.deep.equal({
          body: {
            supplier: 'supplier-alias',
            description: 'some description - test',
            requiredBy: '2022-06-17T07:31:37.602Z',
            items: [
              '50000000-0000-1000-5500-000000000001',
              '50000000-0000-1000-5600-000000000001',
              '50000000-0000-1000-5700-000000000001',
            ],
          },
        })
      })

      it('validates properties by calling a helper method [validate]', () => {
        expect(stubs.insertOrder.getCall(0).args[0]).to.deep.equal({
          supplier: 'supplier-alias',
          supplierAddress: 'supplier-address',
          description: 'some description - test',
          requiredBy: '2022-06-17T07:31:37.602Z',
          items: [
            '50000000-0000-1000-5500-000000000001',
            '50000000-0000-1000-5600-000000000001',
            '50000000-0000-1000-5700-000000000001',
          ],
          status: 'Created',
          buyerAddress: 'self-address',
        })
      })

      it('persist order and returns 201 along with other details', () => {
        expect(response.status).to.equal(201)
        expect(response.response).to.deep.equal({
          id: 'order-id',
          supplier: 'supplier-alias',
          description: 'some description - test',
          requiredBy: '2022-06-17T07:31:37.602Z',
          buyer: 'self-alias',
          items: [
            '50000000-0000-1000-5500-000000000001',
            '50000000-0000-1000-5600-000000000001',
            '50000000-0000-1000-5700-000000000001',
          ],
        })
      })
    })
  })

  describe('/order - get all orders', () => {
    it('should resolve 500 error', async () => {
      const result = await orderController.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('/order/{id} - get by id', () => {
    it('should resolve 500 error', async () => {
      const result = await orderController.get()
      expect(result.status).to.equal(500)
    })
  })

  describe('order transactions controller', () => {
    describe('/order/{id}/creation - get all order transactions', () => {
      it('should resolve 500 error', async () => {
        const result = await orderController.transaction.get()
        expect(result.status).to.equal(500)
      })
    })

    describe('/order/{id}/creation/{creationId} - get by id', () => {
      it('should resolve 500 error', async () => {
        const result = await orderController.transaction.get()
        expect(result.status).to.equal(500)
      })
    })

    describe('/order/{id}/creation/ - creates order transactiion', () => {
      beforeEach(async () => {
        stubs.insertTransaction = stub(db, 'insertOrderTransaction').resolves([])
        stubs.getRecipeIds = stub(db, 'getRecipeByIDs').resolves(recipeExamples)
        stubs.getOrder = stub(db, 'getOrder').resolves([])
        stubs.getSelf = stub(identityService, 'getMemberBySelf').resolves(null)
      })
      afterEach(() => {
        stubs.getSelf.restore()
        stubs.getRecipeIds.restore()
        stubs.insertTransaction.restore()
        stubs.getOrder.restore()
      })

      describe('if invalid parameter supplied', () => {
        beforeEach(async () => {
          response = await createTransaction({ params: { a: 'a' } })
        })

        it('returns 400 and an innstance of BadRequestError', () => {
          expect(response).to.be.an.instanceOf(BadRequestError)
          expect(response.message).to.be.equal('Bad Request: missing params')
        })

        it('does not perform any database queries', () => {
          expect(stubs.insertTransaction.calledOnce).to.equal(false)
          expect(stubs.getOrder.calledOnce).to.equal(false)
        })

        it('does not make request to identity service', () => {
          expect(stubs.getSelf.calledOnce).to.equal(false)
        })

        it('does not call runProcess', () => {
          expect(runProcessReq._eventsCount).to.equal(0)
          expect(runProcessBody).to.be.undefined
        })
      })

      describe('if order can not be found', () => {
        beforeEach(async () => {
          response = await createTransaction({ params: { id: '00000000-0000-1000-3000-000000000001' } })
        })

        it('returns 404 along with instance of NotFoundError ', () => {
          expect(response).to.be.an.instanceOf(NotFoundError)
          expect(response.message).to.be.equal('Not Found: order')
        })

        it('does not make request to the idenity service', () => {
          expect(stubs.getSelf.calledOnce).to.equal(false)
        })

        it('does not call runProcess', () => {
          expect(runProcessReq._eventsCount).to.equal(0)
          expect(runProcessBody).to.be.undefined
        })

        it('does not attempt to insert a order_transaction', () => {
          expect(stubs.insertTransaction.calledOnce).to.equal(false)
        })
      })

      describe('if for any reason identity service fails or selfAddress ir undefined', () => {
        beforeEach(async () => {
          stubs.getOrder.resolves([
            {
              status: 'submitted',
              requiredBy: '2022-06-11T08:47:23.397Z',
            },
          ])
          response = await createTransaction({ params: { id: '00000000-0000-1000-3000-000000000001' } })
        })

        it('returns 400 along with instance of IdentityError', () => {
          expect(response).to.be.an.instanceOf(IdentityError)
          expect(response.message).to.be.equal('Unable to retrieve an identity address')
        })

        it('does not attempt to insert a order_transaction', () => {
          expect(stubs.insertTransaction.calledOnce).to.equal(false)
        })

        it('does not call runProcess', () => {
          expect(runProcessReq._eventsCount).to.equal(0)
          expect(runProcessBody).to.be.undefined
        })
      })

      describe('if contains recipes that have not been created on chain yet', () => {
        beforeEach(async () => {
          stubs.insertTransaction.resolves({})
          stubs.getSelf.resolves('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty')
          stubs.getOrder.resolves([
            {
              status: 'submitted',
              requiredBy: '2022-06-11T08:47:23.397Z',
            },
          ])
          response = await createTransaction({
            params: {
              id: '00000000-0000-1000-3000-000000000001',
            },
            body: { items: [20] },
          })
        })

        it('returns 500 along with instance of NoTokenError', () => {
          expect(response).to.be.an.instanceOf(NoTokenError)
          expect(response.code).to.equal(500)
          expect(response.message).to.equal('Token for recipes has not been created yet.')
        })

        it('does not call runProcess', () => {
          expect(runProcessReq._eventsCount).to.equal(0)
          expect(runProcessBody).to.be.undefined
        })
      })

      describe('happy path', () => {
        // main reason for wrapping int oths so I can utlise before each
        beforeEach(async () => {
          stubs.getRecipeIds.resolves([recipeExamples[0]])
          stubs.getSelf.resolves('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty')
          stubs.insertTransaction.resolves({
            id: '50000000-0000-1000-3000-000000000001',
            status: 'Submitted',
            created_at: '2022-06-11T08:47:23.397Z',
          })
          stubs.getOrder.resolves([
            {
              status: 'submitted',
              requiredBy: '2022-06-11T08:47:23.397Z',
            },
          ])
          response = await createTransaction({
            params: { id: '00000000-0000-1000-3000-000000000001' },
            body: {
              items: ['50000000-0000-1000-5500-000000000001'],
            },
          })
        })

        it('retrieves order details from database', () => {
          expect(stubs.getOrder.getCall(0).args[0]).to.deep.equal('00000000-0000-1000-3000-000000000001')
        })

        it('checks if recipe has a token id', () => {
          expect(stubs.getRecipeIds.getCall(0).args[0]).to.deep.equal(['50000000-0000-1000-5500-000000000001'])
        })

        it('calls run process with formatted body', () => {
          expect(runProcessReq.isDone()).to.equal(true)
        })

        it('call database method to insert a new entry in order_transactions', () => {
          expect(stubs.insertTransaction.getCall(0).args[0]).to.deep.equal('00000000-0000-1000-3000-000000000001')
        })

        it('returns 201 along with other details as per api-doc', () => {
          const { status, response: body } = response
          expect(status).to.equal(201)
          expect(body).to.deep.equal({
            id: '50000000-0000-1000-3000-000000000001',
            status: 'Submitted',
            submittedAt: '2022-06-11T08:47:23.397Z',
          })
        })
      })
    })
  })
})
