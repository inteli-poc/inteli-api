const { describe, before, test } = require('mocha')
const { expect } = require('chai')

const { createHttpServer } = require('../../app/server')
const { postOrderRoute } = require('../helper/routeHelper')

describe('order', function () {
  describe('valid order', function () {
    let app

    before(async function () {
      app = await createHttpServer()
    })

    test.only('POST Order - 201', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
        requiredBy: new Date().toISOString(),
        items: [],
      }

      const response = await postOrderRoute(newProject, app)
      expect(response.status).to.equal(201)
      expect(response.body[0].owner).deep.equal(newProject.owner)
    })

    test('POST Order with required Params missing - 400', async function () {
      const newProject = {
        owner: 'BAE',
        manufacturer: 'Maher',
        status: 'Accepted',
      }

      const response = await postOrderRoute(newProject, app)
      expect(response.status).to.equal(400)
    })
  })
})
