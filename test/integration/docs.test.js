const { describe, before, it } = require('mocha')
const jsonChai = require('chai-json')
const { expect } = require('chai').use(jsonChai)

const { createHttpServer } = require('../../app/server')
const { apiDocs } = require('../helper/routeHelper')

const OpenAPISchemaValidator = require('openapi-schema-validator').default

var validator = new OpenAPISchemaValidator({
  version: 3,
  // optional
  extensions: {
    /* place any properties here to extend the schema. */
  },
})

describe('api-docs', function () {
  let app

  before(async function () {
    app = await createHttpServer()
  })

  it('should return 200', async function () {
    const actualResult = await apiDocs(app)

    expect(actualResult.status).to.equal(200)
    expect(actualResult.body).to.be.a.jsonObj()

    const validations = validator.validate(actualResult.body)

    expect(validations.errors).to.be.empty
  })
})
