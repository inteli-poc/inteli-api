const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const { mapRecipeData } = require('./helpers')
const { BadRequestError, NotFoundError } = require('../../../utils/errors')

const throwErr = (type, req) => {
  switch (type) {
    case 400:
      throw new BadRequestError({
        message: 'missing parameters',
        req,
      })
    case 404:
      throw new NotFoundError({
        message: 'not found',
        req,
      })
  }
}

module.exports = {
  // TODO abstranct to transactions controller and first path e.g. /recipe /order is database model
  // do this along with order
  transaction: {
    getAll: async (req) => {
      const { id } = req.params
      if (!id) throwErr(400, req)

      const transactions = await db.getAllRecipeTransactions(id)

      return {
        status: 200,
        response: transactions.map(({ id, created_at: submittedAt, status }) => ({ id, submittedAt, status })),
      }
    },
    get: async (req) => {
      const { creationId, id } = req.params
      if (!id || !creationId) throwErr(400, req)

      const [transaction] = await db.client
        .from('recipe_transactions')
        .select('*')
        .where({ id: creationId, recipe_id: id })
      if (!transaction) throwErr(404, req)

      return {
        status: 200,
        creation: transaction,
      }
    },
    create: async (req) => {
      const { id } = req.params
      if (!id) throwErr(400, req)

      const [recipe] = await db.client.from('recipes').select('*').where({ id })
      if (!recipe) throwErr(404, req)

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
      const transaction = await db.client
        .from('recipe_transactions')
        .insert({
          token_id: token[0],
          recipe_id: id,
          status: 'Submitted',
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
