const createJWKSMock = require('mock-jwks').default
const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const { createHttpServer } = require('../../app/server')
const { postOrderRoute } = require('../helper/routeHelper')
const { setupIdentityMock } = require('../helper/identityHelper')
const { seed, cleanup } = require('../seeds/orders')
const { AUTH_ISSUER, AUTH_AUDIENCE, AUTH_TYPE, DSCP_API_HOST, DSCP_API_PORT } = require('../../app/env')
const dscpApiUrl = `http://${DSCP_API_HOST}:${DSCP_API_PORT}`
const nock = require('nock')

const describeAuthOnly = AUTH_TYPE === 'JWT' ? describe : describe.skip

describeAuthOnly('order- authenticated', function () {
  describe('valid order', function () {
    this.timeout(10000)
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
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
      nock(dscpApiUrl)
        .post('/v3/run-process', () => {
          return true
        })
        .reply(200, [20])
    })

    after(async function () {
      await cleanup()
      await jwksMock.stop()
      nock.cleanAll()
    })

    setupIdentityMock()

    test('POST order  - 201', async function () {
      const newOrder = {
        externalId: 'some-external-d',
        supplier: 'valid-1',
        items: [
          {
            requiredBy: '2022-09-23T09:30:51.190Z',
            recipeId: '36345f4f-0000-42e2-83f9-79e2e195e000',
            price: 1100,
            quantity: 1,
            currency: 'some-currency',
            deliveryTerms: 'some-delivery-terms',
            deliveryAddress: 'some-delivery-address',
            lineText: 'some-line-text',
            exportClassification: 'some-export-classification',
            unitOfMeasure: 'some-unit-of-measure',
            priceType: 'some-price-type',
            confirmedReceiptDate: '2022-09-23T09:30:51.190Z',
            description: 'some-description',
          },
        ],
        businessPartnerCode: 'some-business-partner-code',
      }
      const response = await postOrderRoute(newOrder, app, authToken)

      expect(response.status).to.equal(201)
    })
  })
})
