const logger = require('../../utils/Logger')
const { buildValidatedJsonHandler } = require('../../utils/routeResponseValidator')
const { BadRequestError } = require('../../utils/errors')
const { getDefaultSecurity } = require('../../utils/auth')

// eslint-disable-next-line no-unused-vars
module.exports = function (recipeService, identityService) {
  const doc = {
    GET: buildValidatedJsonHandler(
      async function (req) {
        const recipes = await recipeService.getRecipes()
        const result = await Promise.all(
          recipes.map(async (recipe) => {
            const { alias: supplierAlias } = await identityService.getMemberByAddress(req, recipe.supplier)
            const { alias: ownerAlias } = await identityService.getMemberByAddress(req, recipe.owner)
            const { id, external_id, name, image_attachment_id, material, alloy, price, required_certs } = recipe
            return {
              id,
              externalId: external_id,
              name,
              imageAttachmentId: image_attachment_id,
              material,
              alloy,
              price,
              requiredCerts: required_certs,
              supplier: supplierAlias,
              owner: ownerAlias,
            }
          })
        )
        return { status: 200, response: result }
      },
      {
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
        },
        security: getDefaultSecurity(),
        tags: ['recipe'],
      }
    ),
    POST: buildValidatedJsonHandler(
      async function (req) {
        if (!req.body) {
          throw new BadRequestError({ message: 'No body provided uploaded', req })
        }

        const { externalId, name, imageAttachmentId, material, alloy, price, requiredCerts, supplier } = req.body

        const { address: supplierAddress } = await identityService.getMemberByAlias(req, supplier)
        const selfAddress = await identityService.getMemberBySelf(req)
        const { alias: selfAlias } = await identityService.getMemberByAddress(req, selfAddress)

        const recipe = await recipeService.createRecipe({
          external_id: externalId,
          name,
          image_attachment_id: imageAttachmentId,
          material,
          alloy,
          price,
          required_certs: JSON.stringify(requiredCerts),
          owner: selfAddress,
          supplier: supplierAddress,
        })

        logger.info('Recipe created: ', recipe.id)

        return {
          status: 201,
          response: {
            id: recipe.id,
            owner: selfAlias,
            ...req.body,
          },
        }
      },
      {
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
                  $ref: '#/components/schemas/BadRequestError',
                },
              },
            },
          },
        },
        security: getDefaultSecurity(),
        tags: ['recipe'],
      }
    ),
  }

  return doc
}
