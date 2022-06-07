const { getDefaultSecurity } = require('../../../utils/auth')
const { buildValidatedJsonHandler } = require('../../../utils/routeResponseValidator')

// eslint-disable-next-line no-unused-vars
module.exports = function (recipeService, identityService) {
  const doc = {
    GET: buildValidatedJsonHandler(
      async function (req) {
        const { id } = req.params
        const result = await recipeService.getRecipeByID(id)
        const { alias: supplierAlias } = await identityService.getMemberByAddress(req, result.supplier)
        const { alias: ownerAlias } = await identityService.getMemberByAddress(req, result.owner)

        return {
          status: 200,
          response: {
            id: result.id,
            externalId: result.external_id,
            name: result.name,
            imageAttachmentId: result.image_attachment_id,
            material: result.material,
            alloy: result.alloy,
            price: result.price,
            requiredCerts: result.required_certs,
            supplier: supplierAlias,
            owner: ownerAlias,
          },
        }
      },
      {
        summary: 'Get Recipe',
        parameters: [
          {
            description: 'Id of the recipe to get',
            in: 'path',
            required: true,
            name: 'id',
            allowEmptyValue: false,
            schema: {
              $ref: '#/components/schemas/ObjectReference',
            },
          },
        ],
        responses: {
          200: {
            description: 'Return Recipe',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Recipe',
                },
              },
            },
          },
          404: {
            description: 'Recipe not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/NotFoundError',
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
