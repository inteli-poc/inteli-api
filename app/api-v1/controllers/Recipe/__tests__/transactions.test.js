const nock = require('nock')
const { expect } = require('chai')
const { stub } = require('sinon')

const { BadRequestError, NotFoundError } = require('../../../../utils/errors')
const db = require('../../../../db')
const { transaction } = require('..')
const { recipeExample, transactionsExample, listResponse, recipeId } = require('./transaction_fixtures')
const { DSCP_API_HOST, DSCP_API_PORT } = require('../../../../env')

const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`

const postPayload = {
  params: {
    id: 'recipe-id',
  },
  token: 'some-auth-token',
}

const getPayload = {
  params: {
    id: '10000000-0000-1000-9000-000000000001',
    creationId: '00000000-0000-1000-9000-000000000001',
  },
  token: 'some-auth-token',
}

const submitTransaction = async (req) => {
  try {
    return await transaction.create(req)
  } catch (err) {
    return err
  }
}

const getAllTransactions = async (req) => {
  try {
    return await transaction.getAll(req)
  } catch (err) {
    return err
  }
}

const getTransaction = async (req) => {
  try {
    return await transaction.get(req)
  } catch (err) {
    return err
  }
}

describe('recipe transactions controller', () => {
  let stubs = {}
  let response
  let runProcessBody

  before(async () => {
    nock(dscpApiUrl).post('/v3/run-process').reply(200, [20])
  })

  afterEach(() => {
    stubs = {}
    nock.cleanAll()
  })

  describe('transactions /getAll', () => {
    beforeEach(async () => {
      stubs.getAllRecipeTransactionsStub = stub(db, 'getAllRecipeTransactions').resolves([])
    })
    afterEach(() => {
      stubs.getAllRecipeTransactionsStub.restore()
    })

    describe('if req.params.id is not provided', () => {
      beforeEach(async () => {
        response = await getAllTransactions({ params: {} })
      })

      it('throws validation error', () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('Bad Request: missing params')
      })

      it('does not perform any database calls and does not create transaction', () => {
        expect(stubs.getAllRecipeTransactionsStub.calledOnce).to.equal(false)
      })
    })

    describe('if none transactions found', () => {
      beforeEach(async () => {
        response = await getAllTransactions({ params: { id: 'RECIPE00-9000-1000-8000-000000000000' } })
      })

      it('returns an empty list', () => {
        const { status, response: body } = response
        expect(status).to.be.equal(200)
        expect(body).to.deep.equal([])
      })
    })

    describe('happy path', () => {
      beforeEach(async () => {
        stubs.getAllRecipeTransactionsStub.restore()
        stubs.getAllRecipeTransactionsStub = stub(db, 'getAllRecipeTransactions').resolves(transactionsExample)
        response = await getAllTransactions({ params: { id: recipeId } })
      })

      it('returns an array of transactions', () => {
        const { status, response: body } = response
        expect(status).to.be.equal(200)
        expect(body).to.deep.equal(listResponse)
      })
    })
  })

  describe('transactions /create', () => {
    beforeEach(async () => {
      stubs.getRecipe = stub(db, 'getRecipe').resolves([])
      stubs.insertTransaction = stub(db, 'insertRecipeTransaction').resolves({
        id: '50000000-0000-1000-3000-000000000001',
        status: 'Submitted',
        created_at: '2022-06-11T08:47:23.397Z',
      })
    })
    afterEach(() => {
      stubs.insertTransaction.restore()
      stubs.getRecipe.restore()
    })

    describe('if req.params.id is not provided', () => {
      beforeEach(async () => {
        response = await submitTransaction({ params: {} })
      })

      it('throws validation error', () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('Bad Request: missing params')
      })

      it('does not perform any database calls and does not create transaction', () => {
        expect(stubs.getRecipe.calledOnce).to.equal(false)
        expect(stubs.insertTransaction.calledOnce).to.equal(false)
      })
    })

    describe('if recipe does not exists in local db', () => {
      beforeEach(async () => {
        response = await submitTransaction({ params: { id: '10000000-9000-1000-8000-000000000000' } })
      })

      it('throws not found error along with the message', () => {
        expect(response).to.be.an.instanceOf(NotFoundError)
        expect(response.message).to.be.equal('Not Found: recipes')
      })

      it('does not create a transaction', () => {
        expect(stubs.insertTransaction.calledOnce).to.equal(false)
      })
    })

    describe('happy path', () => {
      beforeEach(async () => {
        nock(dscpApiUrl)
          .post('/v3/run-process', function (body) {
            runProcessBody = body
            return true
          })
          .reply(200, [20])
        stubs.getRecipe.restore()
        stubs.insertTransaction.restore()
        stubs.getRecipe = stub(db, 'getRecipe').resolves([recipeExample])
        stubs.insertTransaction = stub(db, 'insertRecipeTransaction').resolves({
          id: '50000000-0000-1000-3000-000000000001',
          status: 'Submitted',
          created_at: '2022-06-11T08:47:23.397Z',
        })
        response = await submitTransaction(postPayload)
      })

      afterEach(() => {
        stubs.getRecipe.restore()
        nock.cleanAll()
      })

      it('checks if recipe is in local db', () => {
        expect(stubs.getRecipe.getCall(0).args[0]).to.deep.equal('recipe-id')
      })

      it('calls runProcess with correct data', () => {
        const splitReqBody = runProcessBody.split('\n')
        const dataHeader = splitReqBody[1]
        const { inputs, outputs } = JSON.parse(splitReqBody[3])
        const { roles, metadata } = outputs[0]

        expect(dataHeader).to.equal('Content-Disposition: form-data; name="request"\r')
        expect(inputs).to.deep.equal([])
        expect(roles).to.deep.contain({
          Owner: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
        })
        expect(metadata).to.deep.contain({
          externalId: { type: 'LITERAL', value: 'TEST-externalId' },
          name: { type: 'LITERAL', value: 'TEST-name' },
          material: { type: 'LITERAL', value: 'TEST-material' },
          alloy: { type: 'LITERAL', value: 'TEST-alloy' },
          requiredCerts: { type: 'FILE', value: 'required_certs.json' },
          type: { type: 'LITERAL', value: 'RECIPE' },
          image: { type: 'FILE', value: 'foo.jpg' },
          transactionId: { type: 'LITERAL', value: '50000000000010003000000000000001' },
        })
      })

      it('calls runProcess with certificate data', async () => {
        const splitReqBody = runProcessBody.split('\n')
        const certificatesHeader1 = splitReqBody[5]
        const certificatesHeader2 = splitReqBody[6]
        const certificatesRequestBody = splitReqBody[8]

        expect(certificatesHeader1).to.equal(
          'Content-Disposition: form-data; name="file"; filename="required_certs.json"\r'
        )
        expect(certificatesHeader2).to.equal('Content-Type: application/json\r')
        expect(certificatesRequestBody).to.equal('[{"description":"TEST-certificate"}]\r')
      })

      it('calls runProcess with image data', async () => {
        const splitReqBody = runProcessBody.split('\n')

        const imageHeader1 = splitReqBody[10]
        const imageHeader2 = splitReqBody[11]
        const imageRequestBody = splitReqBody[13]

        expect(imageHeader1).to.equal('Content-Disposition: form-data; name="file"; filename="foo.jpg"\r')
        expect(imageHeader2).to.equal('Content-Type: image/jpeg\r')
        expect(imageRequestBody).to.equal('\x00\r')
      })

      it('inserts new transaction to local db', () => {
        expect(stubs.insertTransaction.getCall(0).args).to.be.deep.equal(['recipe-id'])
      })

      it('returns 200 along with the transaction id', () => {
        const { status, response: body } = response
        expect(status).to.be.equal(200)
        expect(body).to.deep.equal({
          id: '50000000-0000-1000-3000-000000000001',
          status: 'Submitted',
          submittedAt: '2022-06-11T08:47:23.397Z',
        })
      })
    })
  })

  describe('transactions /get', () => {
    beforeEach(async () => {
      stubs.getRecipe = stub(db, 'getRecipe').resolves([])
      stubs.getTransaction = stub(db, 'getRecipeTransaction').resolves([transactionsExample[0]])
      response = await getTransaction(getPayload)
    })

    afterEach(() => {
      stubs.getRecipe.restore()
      stubs.getTransaction.restore()
    })

    describe('if req.params.id is not provided', () => {
      beforeEach(async () => {
        response = await getTransaction({ params: {} })
      })

      it('throws validation error', () => {
        expect(response).to.be.an.instanceOf(BadRequestError)
        expect(response.message).to.be.equal('Bad Request: missing params')
      })

      it('does not perform any database calls and does not create transaction', () => {
        expect(stubs.getRecipe.calledOnce).to.equal(false)
      })
    })

    describe('if recipe does not exists in local db', () => {
      beforeEach(async () => {
        stubs.getTransaction.restore()
        stubs.getTransaction = stub(db, 'getRecipeTransaction').resolves([])
        response = await getTransaction(getPayload)
      })

      it('throws not found error along with the message', () => {
        expect(response).to.be.an.instanceOf(NotFoundError)
        expect(response.message).to.be.equal('Not Found: recipe_transactions')
      })
    })

    it('returns transaction', () => {
      expect(response).to.deep.equal({
        status: 200,
        creation: {
          created_at: '2022-05-22T08:04:29.316Z',
          updated_at: '2022-05-22T08:04:29.316Z',
          id: '00000000-1000-1000-8000-0000000000000',
          recipe_id: '10000000-0000-1000-8000-0000000000000',
          status: 'Accepted',
          latest_token_id: 2,
          type: 'Creation',
        },
      })
    })
  })
})
