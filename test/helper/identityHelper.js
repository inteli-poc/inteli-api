const { beforeEach, afterEach } = require('mocha')
const nock = require('nock')

const { IDENTITY_SERVICE_HOST, IDENTITY_SERVICE_PORT } = require('../../app/env')

const setupIdentityMock = function () {
  beforeEach(async function () {
    nock(`http://${IDENTITY_SERVICE_HOST}:${IDENTITY_SERVICE_PORT}`)
      .get('/v1/members/5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty')
      .reply(200, {
        alias: 'valid-1',
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      })
      .get('/v1/members/valid-1')
      .reply(200, {
        alias: 'valid-1',
        address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      })
      .get('/v1/members/5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY')
      .reply(200, {
        alias: 'valid-2',
        address: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
      })
      .get('/v1/members/valid-2')
      .reply(200, {
        alias: 'valid-2',
        address: '5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY',
      })
      .get('/v1/members/invalid')
      .reply(404, {})
      .get('/v1/members/error')
      .reply(500, {})
  })

  afterEach(async function () {
    nock.cleanAll()
  })
}

module.exports = {
  setupIdentityMock,
}
