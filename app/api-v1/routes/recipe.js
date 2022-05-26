const logger = require('../../utils/Logger')
const { BadRequestError } = require('../../utils/errors')

// eslint-disable-next-line no-unused-vars
module.exports = function (recipeService, identityService) {
  const doc = {
    GET: async function (req, res) {
      const recipes = await recipeService.getRecipes()
      const result = await Promise.all(
        recipes.map(async (recipe) => {
          const { alias: supplierAlias } = await identityService.getMemberByAddress(req, recipe.supplier)
          const { id, externalId, name, imageAttachmentId, material, alloy, price, requiredCerts } = recipe
          return {
            id,
            externalId,
            name,
            imageAttachmentId,
            material,
            alloy,
            price,
            requiredCerts,
            supplier: supplierAlias,
          }
        })
      )
      res.status(200).json(result)
    },
    POST: async function (req, res) {
      if (!req.body) {
        throw new BadRequestError({ message: 'No body provided uploaded', req })
      }

      const { externalId, name, imageAttachmentId, material, alloy, price, requiredCerts, supplier } = req.body

      const { address: supplierAddress } = await identityService.getMemberByAlias(req, supplier)

      const recipe = await recipeService.createRecipe({
        external_id: externalId,
        name,
        image_attachment_id: imageAttachmentId,
        material,
        alloy,
        price,
        required_certs: JSON.stringify(requiredCerts),
        supplier: supplierAddress,
      })

      logger.info('Recipe created: ', recipe.id)

      res.status(201).json({
        id: recipe.id,
        ...req.body,
      })
    },
  }

  doc.GET.apiDoc = {
    summary: 'List Recipes',
    parameters: [],
    responses: {
      200: {
        description: 'Return Recipes',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Recipe',
              },
            },
          },
        },
      },
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: ['recipe'],
  }

  doc.POST.apiDoc = {
    summary: 'Create Recipe',
    requestBody: {
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/NewRecipe',
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Recipe Created',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Recipe',
            },
          },
        },
      },
      400: {
        description: 'Invalid request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/BadRequestError',
            },
          },
        },
      },
      default: {
        description: 'An error occurred',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/responses/Error',
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: ['recipe'],
  }

  return doc
}
