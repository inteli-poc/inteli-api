const { describe, before, test } = require('mocha')
const { expect } = require('chai')
const createJWKSMock = require('mock-jwks').default

const { createHttpServer } = require('../../app/server')
const { postOrderRoute } = require('../helper/routeHelper')
const { setupIdentityMock } = require('../helper/identityHelper')
const { seed, cleanup } = require('../seeds/orders')
const { AUTH_ISSUER, AUTH_AUDIENCE, AUTH_TYPE } = require('../../app/env')

const describeAuthOnly = AUTH_TYPE === 'JWT' ? describe : describe.skip
const describeNoAuthOnly = AUTH_TYPE === 'NONE' ? describe : describe.skip

describeAuthOnly('order - authenticated', function () {
  describe('valid order', function () {
    this.timeout(5000)
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

    setupIdentityMock()

    test('POST Order with existing supplier - 201', async function () {
      const newOrder = {
        externalId: 'some-external-id',
        supplier: 'valid-1',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }
      const response = await postOrderRoute(newOrder, app, authToken)

      expect(response.status).to.equal(201)
      expect(response.body.supplier).deep.equal(newOrder.supplier)
    })

    test('POST Order - Check ID & Supplier', async function () {
      const newOrder = {
        externalId: 'some-external-id',
        supplier: 'valid-1',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }
      const response = await postOrderRoute(newOrder, app, authToken)
      expect(response.body.supplier).to.equal('valid-1')
      expect(response.body.buyer).to.equal('valid-2')
      expect(response.body.items).to.contain('10000000-0000-1000-8000-000000000000')
      expect(response.status).to.equal(201)
    })

    test('POST Order with non-existant supplier - 400', async function () {
      const newProject = {
        externalId: 'some-external-id',
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order with more than one item - 201', async function () {
      const newProject = {
        externalId: 'some-external-id',
        supplier: 'valid-1',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-8000-000000000000', '10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(201)
    })

    test('POST Order with 2 different items - 201', async function () {
      const newProject = {
        externalId: 'some-external-id',
        supplier: 'valid-1',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-9000-000000000000', '10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(201)
    })

    test('POST Order with incorrect supplier - 400', async function () {
      const newProject = {
        externalId: 'some-external-id',
        supplier: 'valid-2',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order - Invalid UUID', async function () {
      const newProject = {
        externalId: 'some-external-id',
        supplier: 'valid-1',
        requiredBy: new Date().toISOString(),
        items: ['00000000-0000-1000-8000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order with required Params missing - 400', async function () {
      const newProject = {
        externalId: 'some-external-id',
        supplier: 'foobar3000',
        requiredBy: new Date().toISOString(),
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })

    test('POST Order - Empty Request Body', async function () {
      const newProject = {}

      const response = await postOrderRoute(newProject, app, authToken)
      expect(response.status).to.equal(400)
    })
  })
})

describeNoAuthOnly('order - no auth', function () {
  describe('valid order', function () {
    this.timeout(5000)
    let app

    before(async function () {
      await seed()
      app = await createHttpServer()
    })

    after(async function () {
      await cleanup()
    })

    setupIdentityMock()

    test('POST Order - Check ID & Manufacturer', async function () {
      const newOrder = {
        externalId: 'some-external-id',
        supplier: 'valid-1',
        requiredBy: new Date().toISOString(),
        items: ['10000000-0000-1000-8000-000000000000'],
        price: 1100,
        quantity: 1,
        currency: 'some-currency',
        deliveryTerms: 'some-delivery-terms',
        deliveryAddress: 'some-delivery-address',
        lineText: 'some-line-text',
        exportClassification: 'some-export-classification',
        unitOfMeasure: 'some-unit-of-measure',
        priceType: 'some-price-type',
        confirmedReceiptDate: 'some-confirmed-receipt-date',
        description: 'some-description',
        businessPartnerCode: 'some-business-partner-code',
      }
      const response = await postOrderRoute(newOrder, app, null)
      expect(response.body.supplier).to.equal('valid-1')
      expect(response.body.buyer).to.equal('valid-2')
      expect(response.body.items).to.contain('10000000-0000-1000-8000-000000000000')
      expect(response.status).to.equal(201)
    })
  })
})
