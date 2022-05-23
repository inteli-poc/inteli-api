const { runProcess } = require('../../../utils/dscp-api')
const { client } = require('../../../db')
const { mapRecipeData } = require('./helpers')
const { BadRequestError, NotFoundError } = require('../../../utils/errors')

const throwErr = (type, path) => {
  switch (type) {
    case 400:
      throw new BadRequestError({
        message: 'missing parameters',
        path,
      })
    case 404:
      throw new NotFoundError({
        message: 'not found',
        path,
      })
  }
}

module.exports = {
  transaction: {
    get: async (req) => {
      const path = '/recipe/{id}/creation/${creationId}'
      const { creationId, id } = req.params
      const [transaction] = await client.from('recipe_transactions').select('*').where({ id: creationId, token_id: id })

      if (!id || !creationId) throwErr(400, path)
      if (!transaction) throwErr(404, path)

      return {
        status: 200,
        creation: transaction,
      }
    },
    create: async (req) => {
      const path = '/recipe/{id}/creation'
      const { id } = req.params
      if (!id) throwErr(400, path)

      const [recipe] = await client.from('recipes').select('*').where({ id })
      if (!recipe) throwErr(404, path)

      const payload = {
        inputs: [],
        outputs: [
          {
            roles: { Owner: recipe.supplier },
            metadata: mapRecipeData(recipe),
          },
        ],
      }
      const token = await runProcess(payload, req.token)
      const transaction = await client
        .from('recipe_transactions')
        .insert({
          token_id: token[0],
          recipe_id: id,
          status: 'submitted',
        })
        .returning(['id'])
        .then((t) => t[0])

      return {
        status: 200,
        message: `transaction ${transaction.id} has been created`,
      }
    },
  },
}
