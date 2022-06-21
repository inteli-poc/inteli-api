const createJWKSMock = require('mock-jwks').default
const { describe, before, it, after } = require('mocha')
const { expect } = require('chai')
const { seed, cleanup } = require('../seeds/recipes')

const { createHttpServer } = require('../../app/server')
const { AUTH_ISSUER, AUTH_AUDIENCE, FILE_UPLOAD_SIZE_LIMIT_BYTES, AUTH_TYPE } = require('../../app/env')
const {
  postAttachment,
  postAttachmentNoFile,
  postAttachmentJSON,
  getAttachmentRouteJSON,
  getAttachmentRouteOctet,
} = require('../helper/routeHelper')

const describeAuthOnly = AUTH_TYPE === 'JWT' ? describe : describe.skip
const describeNoAuthOnly = AUTH_TYPE === 'NONE' ? describe : describe.skip

describeAuthOnly('attachments - authenticated', function () {
  let app
  let authToken
  let jwksMock

  before(async function () {
    await seed()
    app = await createHttpServer()
    jwksMock = createJWKSMock(AUTH_ISSUER)
    jwksMock.start()
    authToken = jwksMock.token({
      aud: AUTH_AUDIENCE,
      iss: AUTH_ISSUER,
    })
  })

  after(async function () {
    await cleanup()
    await jwksMock.stop()
  })

  it('should return 201 - file uploaded', async function () {
    const size = 100
    const filename = 'test.pdf'
    const response = await postAttachment(app, Buffer.from('a'.repeat(size)), filename, authToken)

    expect(response.status).to.equal(201)
    expect(response.body).to.have.property('id')
    expect(response.body.filename).to.equal(filename)
    expect(response.body.size).to.equal(size)
  })

  it('should return 400 - over file size limit', async function () {
    const response = await postAttachment(app, Buffer.alloc(FILE_UPLOAD_SIZE_LIMIT_BYTES + 1), 'tooLarge.pdf')

    expect(response.status).to.equal(400)
    expect(response.error.text).to.equal('File too large')
  })

  it('should return 400 - no file', async function () {
    const response = await postAttachmentNoFile(app, authToken)
    expect(response.status).to.equal(400)
    expect(response.body).to.deep.equal({ message: 'Bad Request: No file uploaded' })
  })

  it('should return 201 - json object uploaded', async function () {
    const attachment = { key: 'test' }
    const response = await postAttachmentJSON(app, attachment, authToken)

    expect(response.status).to.equal(201)
    expect(response.body).to.have.property('id')
    expect(response.body.filename).to.equal('json')
    expect(response.body.size).to.equal(Buffer.from(JSON.stringify(attachment)).length)
  })

  it('should return 201 - json array uploaded', async function () {
    const attachment = ['test']
    const response = await postAttachmentJSON(app, attachment, authToken)

    expect(response.status).to.equal(201)
    expect(response.body).to.have.property('id')
    expect(response.body.filename).to.equal('json')
    expect(response.body.size).to.equal(Buffer.from(JSON.stringify(attachment)).length)
  })

  it('should return 400 - json string uploaded', async function () {
    const attachment = 'test'
    const response = await postAttachmentJSON(app, attachment, authToken)

    expect(response.status).to.equal(400)
    expect(response.error.text).to.equal('Unexpected token t in JSON at position 0')
  })

  it('should return from the JSON route', async function () {
    const attachment = '00000000-0000-1000-9000-000000000001'
    const response = await getAttachmentRouteJSON(attachment, app, authToken)
    expect(response.status).to.equal(200)
    expect(response.body).deep.equal({ 'First Item': 'Test Data' })
  })

  it('should return from the octet route', async function () {
    const attachment = '00000000-0000-1000-8000-000000000001'
    const response = await getAttachmentRouteOctet(attachment, app, authToken)
    expect(response.status).to.equal(200)
  })

  it('returns octet if file is JSON', async function () {
    const attachment = '00000000-0000-1000-9000-000000000001'
    const { status, body, header } = await getAttachmentRouteOctet(attachment, app, authToken)

    expect(status).to.equal(200)
    expect(body).to.be.instanceof(Buffer)
    expect(header).to.deep.contain({
      immutable: 'true',
      maxage: '31536000000',
      'content-disposition': 'attachment; filename="json"',
      'access-control-expose-headers': 'content-disposition',
      'content-type': 'application/octet-stream',
      'content-length': '26',
    })
  })

  it('returns JSON', async function () {
    const attachment = '00000000-0000-1000-9000-000000000001'
    const { status, body, header } = await getAttachmentRouteJSON(attachment, app, authToken)

    expect(status).to.equal(200)
    expect(body).to.deep.equal({ 'First Item': 'Test Data' })
    expect(header).to.deep.contain({
      'content-type': 'application/json; charset=utf-8',
    })
  })

  it('should return 404 when requesting incorrect ID', async function () {
    const attachment = '00000000-0000-1000-8000-000000000002'
    const response = await getAttachmentRouteOctet(attachment, app, authToken)
    expect(response.status).to.equal(404)
  })

  it('should return 406 if requested for JSON and mime type is not JSON', async function () {
    const attachment = '00000000-0000-1000-8000-000000000001'
    const { status, body, header } = await getAttachmentRouteJSON(attachment, app, authToken)

    expect(status).to.equal(406)
    expect(body.message).to.be.equal('Client file request not supported')
    expect(header).to.deep.contain({
      'content-type': 'application/json; charset=utf-8',
      vary: 'Accept-Encoding',
    })
  })

  it('should return 400 when requesting invalid ID', async function () {
    const attachment = 'invalid'
    const response = await getAttachmentRouteOctet(attachment, app, authToken)
    expect(response.status).to.equal(400)
  })
})

describeNoAuthOnly('attachments - no auth', function () {
  let app

  before(async function () {
    app = await createHttpServer()
  })

  it('should return 201 - file uploaded', async function () {
    const size = 100
    const filename = 'test.pdf'
    const response = await postAttachment(app, Buffer.from('a'.repeat(size)), filename, null)

    expect(response.status).to.equal(201)
    expect(response.body).to.have.property('id')
    expect(response.body.filename).to.equal(filename)
    expect(response.body.size).to.equal(size)
  })
})
