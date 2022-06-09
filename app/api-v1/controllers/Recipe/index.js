const { runProcess } = require('../../../utils/dscp-api')
const db = require('../../../db')
const { mapRecipeData } = require('./helpers')
const { BadRequestError, NotFoundError } = require('../../../utils/errors')

module.exports = {
  // TODO abstranct to transactions controller and first path e.g. /recipe /order is database model
  // do this along with order
  transaction: {
    getAll: async (req) => {
      const { id } = req.params
      if (!id) throw new BadRequestError('missing params')
      const transactions = await db.getAllRecipeTransactions(id)

      return {
        status: 200,
        response: transactions.map(({ id, created_at, status }) => ({
          id,
          submittedAt: new Date(created_at).toISOString(),
          status,
        })),
      }
    },
    get: async (req) => {
      const { creationId, id } = req.params
      if (!id || !creationId) throw new BadRequestError('missing params')

      const [transaction] = await db.getRecipeTransaction(creationId, id)
      if (!transaction) throw new NotFoundError('recipe_transactions')

      return {
        status: 200,
        creation: transaction,
      }
    },
    create: async (req) => {
      const { id } = req.params
      if (!id) throw new BadRequestError('missing params')

      const [recipe] = await db.getRecipe(id)
      if (!recipe) throw new NotFoundError('recipes')

      const transaction = await db.insertRecipeTransaction(id)
      const payload = {
        image: recipe.binary_blob,
        requiredCerts: Buffer.from(JSON.stringify(recipe.required_certs)),
        inputs: [],
        outputs: [
          {
            roles: { Owner: recipe.supplier },
            metadata: mapRecipeData({ ...recipe, transaction }),
          },
        ],
      }
      runProcess(payload, req.token)

      return {
        status: 200,
        transactionId: transaction.id,
        message: `transaction ${transaction.id} has been created`,
      }
    },
  },
}
