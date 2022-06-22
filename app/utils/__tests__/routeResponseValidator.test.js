const { describe, it, before, after } = require('mocha')
const { expect } = require('chai')
const sinon = require('sinon')
const validatorMod = require('openapi-response-validator')

const { buildValidatedJsonHandler, commonResponses } = require('../routeResponseValidator')
const { exampleDoc } = require('./response_validator_fixtures')
const commonApiDoc = require('../../api-v1/api-doc')

const mkContext = () => ({ stubs: {} })
const mkExampleControllerCustomHeader = (context) => {
  context.stubs.controller = sinon
    .stub()
    .resolves({ status: 200, response: { foo: 'bar' }, headers: { custom: 'test' } })
}
const mkExampleController = (context) => {
  context.stubs.controller = sinon.stub().resolves({ status: 200, response: { foo: 'bar' } })
}

const withMockedValidator = (context, validateRes) => {
  before(() => {
    const validateResponse = sinon.stub().returns(validateRes)
    const ctor = sinon.stub(validatorMod, 'default').returns({ validateResponse })
    Object.assign(context.stubs, {
      validateResponse,
      ctor,
    })
  })

  after(() => {
    context.stubs.ctor.restore()
  })
}

const mkResponseMock = (context) => {
  const resJson = sinon.stub()
  Object.assign(context.stubs, {
    resJson,
    resSet: sinon.stub(),
    resStatus: sinon.stub().returns({ send: resJson }),
  })

  return {
    status: context.stubs.resStatus,
    set: context.stubs.resSet,
  }
}

describe('buildValidatedJsonHandler', () => {
  let context = mkContext()
  withMockedValidator(context, null)

  before(() => {
    mkExampleController(context)
    context.handler = buildValidatedJsonHandler(context.stubs.controller, exampleDoc)
  })

  it('returns function', () => {
    expect(context.handler).to.be.a('function')
  })

  it('returns function with apiDoc + common responses', () => {
    const expectedResponses = {
      ...commonResponses,
      ...exampleDoc.responses,
    }
    expect(context.handler.apiDoc).to.deep.equal({
      ...exampleDoc,
      responses: expectedResponses,
    })
  })

  it('builds a validator', () => {
    const stub = context.stubs.ctor
    expect(stub.calledOnce).to.equal(true)
  })

  it('builds a validator with responses and components', () => {
    const stub = context.stubs.ctor
    expect(stub.firstCall.args).to.deep.equal([
      {
        responses: {
          ...commonResponses,
          ...exampleDoc.responses,
        },
        components: commonApiDoc.components,
      },
    ])
  })
})

describe('buildValidatedJsonHandler.handler', () => {
  describe('no validation errors', () => {
    let context = mkContext()
    withMockedValidator(context, null)

    before(() => {
      mkExampleController(context)
      context.handler = buildValidatedJsonHandler(context.stubs.controller, exampleDoc)
      context.req = {}
      context.res = mkResponseMock(context)
      context.handler(context.req, context.res)
    })

    it('should call controller', () => {
      const stub = context.stubs.controller
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.equal(context.req)
    })

    it('should respond with returned status', () => {
      const stub = context.stubs.resStatus
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.equal(200)
    })

    it('should respond with json', () => {
      const stub = context.stubs.resJson
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.deep.equal({ foo: 'bar' })
    })
  })

  describe('header', () => {
    let context = mkContext()
    withMockedValidator(context, null)

    before(() => {
      mkExampleControllerCustomHeader(context)
      context.handler = buildValidatedJsonHandler(context.stubs.controller, exampleDoc)
      context.req = {}
      context.res = mkResponseMock(context)
      context.handler(context.req, context.res)
    })

    describe('if headers argument is undefined', () => {
      before(() => {
        mkExampleController(context)
        context.handler = buildValidatedJsonHandler(sinon.stub().resolves({ status: 200, response: {} }), exampleDoc)
        context.req = {}
        context.res = mkResponseMock(context)
        context.handler(context.req, context.res)
      })

      it('returns default headers', () => {
        const stub = context.stubs.resSet
        expect(stub.calledOnce).to.equal(true)
        expect(stub.firstCall.args[0]).to.deep.equal({ 'content-type': 'application/json' })
      })
    })

    it('returns a custom header', () => {
      const stub = context.stubs.resSet
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.deep.equal({ custom: 'test' })
    })
  })

  describe('with validation errors', () => {
    let context = mkContext()
    withMockedValidator(context, 'error')

    before(() => {
      mkExampleController(context)
      context.handler = buildValidatedJsonHandler(context.stubs.controller, exampleDoc)
      context.req = {}
      context.res = mkResponseMock(context)
      context.handler(context.req, context.res)
    })

    it('should call controller', () => {
      const stub = context.stubs.controller
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.equal(context.req)
    })

    it('should respond with returned status 500', () => {
      const stub = context.stubs.resStatus
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.equal(500)
    })

    it('should respond with json', () => {
      const stub = context.stubs.resJson
      expect(stub.calledOnce).to.equal(true)
      expect(stub.firstCall.args[0]).to.deep.equal({ message: 'Internal server error' })
    })
  })
})
