const { PORT, API_VERSION, API_MAJOR_VERSION, AUTH_TYPE, EXTERNAL_ORIGIN, EXTERNAL_PATH_PREFIX } = require('../env')

let url = EXTERNAL_ORIGIN || `http://localhost:${PORT}`
if (EXTERNAL_PATH_PREFIX) {
  url = `${url}/${EXTERNAL_PATH_PREFIX}`
}
url = `${url}/${API_MAJOR_VERSION}`

const securitySchemes =
  AUTH_TYPE === 'JWT'
    ? {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      }
    : {}

const apiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'ApiService',
    version: API_VERSION,
  },
  servers: [
    {
      url,
    },
  ],
  components: {
    schemas: {
      Error: {
        description: 'An error occurred',
        type: 'object',
        properties: {
          message: {
            type: 'string',
          },
        },
        example: { message: 'An error occured' },
      },
      NotFoundError: {
        description: 'This resource cannot be found',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Error' }],
        example: { message: 'This resource cannot be found' },
      },
      BadRequestError: {
        description: 'The request is invalid',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Error' }],
        example: { message: 'The request is invalid' },
      },
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Error' }],
        example: { message: 'An error occurred during jwks verification' },
      },
      NewRecipe: {
        type: 'object',
        properties: {
          externalId: {
            description: 'id of the recipe in an external ERP',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'some-external-system-id',
          },
          name: {
            description: 'Name of the recipe',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'Low-pressure compressor',
          },
          imageAttachmentId: {
            description: 'Example image of the item uploaded as an attachment',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            example: '36345f4f-6535-42e2-83f9-79e2e195ec22',
          },
          material: {
            description: 'Primary material of the constructed recipe',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'Aluminium',
          },
          alloy: {
            description: 'Primary alloy present in the constructed recipe',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'Ti-6Al-4V',
          },
          price: {
            description: 'Price of the recipe. This information is not stored on-chain.',
            type: 'string',
            example: '1200',
          },
          requiredCerts: {
            description: 'Certification requirements',
            type: 'array',
            maxItems: 10,
            items: {
              $ref: '#/components/schemas/CertificationRequirement',
            },
          },
          supplier: {
            description:
              'Name of the supplier who is contracted to build the recipe. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
            example: 'SupplierAlias',
          },
        },
      },
      Recipe: {
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/NewRecipe' }],
        properties: {
          id: {
            description: 'local id of the recipe',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          owner: {
            description:
              'Name of the OEM who owns the design of the recipe. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
            example: 'BuyerAlias',
          },
        },
      },
      CertificationRequirement: {
        type: 'object',
        properties: {
          description: {
            description: 'Description of the certification requirement',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'tensionTest',
          },
        },
      },
      OnChainLiteral: {
        type: 'string',
        description: 'A literal which will be represented as on-chain metadata',
        maxLength: 32,
      },
      ObjectReference: {
        type: 'string',
        description: 'Object references are an internal UUID used to locally identify objects in the system',
        minLength: 36,
        maxLength: 36,
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
      },
      AttachmentEntry: {
        type: 'object',
        description: 'An attachment that can be referenced when creating entries',
        properties: {
          id: {
            $ref: '#/components/schemas/ObjectReference',
          },
          filename: {
            description: 'Name of the file uploaded as an attachment',
            type: 'string',
            maxLength: 255,
            minLength: 1,
            example: 'recipeImage.png',
          },
          size: {
            description: 'size of the uploaded attachment',
            type: 'integer',
            minimum: 1,
          },
        },
      },
      NewBuild: {
        type: 'object',
        description: 'A manufacture run that produces parts',
        properties: {
          externalId: {
            description: 'id of the build in an external system',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'some-external-system-id',
          },
          partIds: {
            description: 'List of parts to be created by this build',
            type: 'array',
            maxItems: 10,
            items: {
              $ref: '#/components/schemas/ObjectReference',
            },
          },
          completionEstimate: {
            description: 'Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Build: {
        type: 'object',
        properties: {
          id: {
            description: 'local id of the build',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          externalId: {
            description: 'id of the build in an external system',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'some-external-system-id',
          },
          partIds: {
            description: 'Parts created by this build ',
            type: 'array',
            maxItems: 10,
            items: {
              description: 'id of a part constructed in this build',
              allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            },
          },
          supplier: {
            description: 'Name of the supplier who ran the build. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
            example: 'SupplierAlias',
          },
          status: {
            description: 'Status of the build',
            type: 'string',
            enum: ['Created', 'Scheduled', 'Started', 'Completed'],
          },
          completionEstimate: {
            description: 'Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
          },
        },
      },
      NewPart: {
        type: 'object',
        description: 'Part to be created',
        properties: {
          recipeId: {
            description: 'id of the recipe that describes the design of this part',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            example: 'A9F1aD4f-A8ca-1f19-A5a2-cABf4e0c5E34',
          },
          price: {
            description: 'price of the order',
            type: 'number',
            format: 'float',
            example: '1200.01',
          },
          quantity: {
            description: 'quantity of the order',
            type: 'integer',
            example: 1,
          },
          description: {
            description: 'description of the order',
            type: 'string',
          },
          confirmedReceiptDate: {
            description: 'confirmed receipt date of the order',
            type: 'string',
            format: 'date-time',
          },
          deliveryTerms: {
            description: 'delivery terms of the order',
            type: 'string',
          },
          deliveryAddress: {
            description: 'delivery address of the order',
            type: 'string',
          },
          priceType: {
            description: 'price type of the order',
            type: 'string',
          },
          unitOfMeasure: {
            description: 'unit of measure for the order',
            type: 'string',
          },
          currency: {
            description: 'currency for the order',
            type: 'string',
          },
          exportClassification: {
            description: 'export classification of the order',
            type: 'string',
          },
          lineText: {
            description: 'line text for the order',
            type: 'string',
          },
        },
      },
      Part: {
        type: 'object',
        description: 'A part being or having been manufactured',
        allOf: [{ $ref: '#/components/schemas/NewPart' }],
        properties: {
          id: {
            description: 'local id of the part',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          supplier: {
            description: 'Name of the suppler who created the part. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
            example: 'SupplierAlias',
          },
          certifications: {
            type: 'array',
            description: 'Certifications this part has been assigned',
            maxItems: 10,
            items: {
              description: 'Certification for a part',
              allOf: [{ $ref: '#/components/schemas/CertificationRequirement' }],
              properties: {
                certificationAttachmentId: {
                  description: 'Attachment Id of the certification evidence',
                  allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
                },
              },
            },
          },
          metadata: {
            type: 'array',
            nullable: true,
            description: 'metadata this part has been assigned',
            maxItems: 10,
            items: {
              description: 'metadata for a part',
              allOf: [{ $ref: '#/components/schemas/NewPartMetadataUpdate' }],
            },
          },
        },
      },
      OrderRequest: {
        type: 'object',
        description: 'A new purchase-order to be submitted',
        properties: {
          businessPartnerCode: {
            description: 'business partner code for the order',
            type: 'string',
          },
          externalId: {
            description: 'id of the order in an external ERP',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
            example: 'some-external-system-id',
          },
          supplier: {
            description:
              'Name of the supplier who will supply parts from this purchase-order. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
            example: 'SupplierAlias',
          },
        },
      },
      NewOrder: {
        type: 'object',
        description: 'A new purchase-order to be submitted',
        allOf: [{ $ref: '#/components/schemas/OrderRequest' }],
        properties: {
          items: {
            type: 'array',
            description: 'List of parts to be supplied',
            maxItems: 10,
            items: {
              description: 'properties of the part',
              allOf: [{ $ref: '#/components/schemas/NewPart' }],
              example: {
                externalId: 'some-external-d',
                supplier: 'bob',
                items: [
                  {
                    requiredBy: '2022-09-23T09:30:51.190Z',
                    recipeId: 'b50cb5ee-8932-40b9-8c1f-6a395f88dbaa',
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
              },
            },
          },
        },
      },
      Order: {
        description: 'A purchase-order',
        allOf: [{ $ref: '#/components/schemas/OrderRequest' }],
        properties: {
          id: {
            description: 'local id of the purchase-order',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          buyer: {
            description:
              'Name of the submitter of the purchase-order. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
            example: 'BuyerAlias',
          },
          status: {
            type: 'string',
            description: 'Status of the purchase-order',
            enum: ['Created', 'Submitted', 'AcknowledgedWithExceptions', 'Amended', 'Accepted', 'Cancelled'],
          },
          parts: {
            type: 'array',
            description: 'list of part Ids',
            items: {
              type: 'object',
              properties: {
                partId: {
                  description: 'part id',
                  allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
                },
                buildStatus: {
                  description: 'build status',
                  type: 'string',
                },
                updateType: {
                  description: 'type of build progress update',
                  type: 'string',
                },
                forecastedDeliveryDate: {
                  description: 'forecasted delivery date',
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
      },
      ChainAction: {
        description: 'An action recorded on-chain against an object',
        type: 'object',
        properties: {
          id: {
            description: 'local id of the chain action',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            example: '36345f4f-6535-42e2-83f9-79e2e195ec22',
          },
          status: {
            description: 'Status of the action',
            type: 'string',
            enum: ['Submitted', 'InBlock', 'Finalised', 'Failed'],
          },
          submittedAt: {
            description: 'Date and time at which the action was submitted',
            type: 'string',
            format: 'date-time',
          },
        },
      },
      NewOrderSubmission: {
        description: 'A new action on an order that causes it to be submitted',
        type: 'object',
        properties: {},
      },
      OrderSubmission: {
        description: 'An action on an order that causes it to be submitted',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }],
      },
      NewOrderAcceptance: {
        description: 'A new action on an order that causes it to be accepted',
        type: 'object',
        properties: {},
      },
      OrderAcceptance: {
        description: 'An action on an order that causes it to be accepted',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }],
      },
      NewOrderCancellation: {
        description: 'A new action on an order that causes it to be cancelled',
        type: 'object',
        properties: {},
      },
      OrderCancellation: {
        description: 'An action on an order that causes it to be cancelled',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }],
      },
      orderHistory: {
        description: 'History of the order',
        type: 'object',
      },
      NewOrderAmendment: {
        description: 'A new action on an order that causes it to be amended following a rejection',
        type: 'object',
        properties: {
          items: {
            type: 'object',
            description: 'part details',
            example: {
              '7137a47b-5887-4333-8422-146c7d5eee8a': {
                requiredBy: '2022-09-23T09:30:51.190Z',
                recipeId: '1d2ec8fc-e063-4865-9dcd-dcddf4941025',
                price: 1100,
                quantity: 1,
                currency: 'new-currency',
                deliveryTerms: 'new-delivery-terms',
                deliveryAddress: 'new-delivery-address',
                lineText: 'new-line-text',
                exportClassification: 'new-export-classification',
                unitOfMeasure: 'new-unit-of-measure',
                priceType: 'new-price-type',
                confirmedReceiptDate: '2022-09-23T09:30:51.190Z',
                description: 'new-description',
              },
            },
          },
        },
      },
      OrderAmendment: {
        description: 'An action on an order that causes it to be amended following a rejection',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewOrderAmendment' }],
      },
      NewOrderAcknowledgement: {
        description: 'A new action on an order that causes it to be rejected along with amendment suggestions',
        type: 'object',
        properties: {
          items: {
            description: 'part details',
            type: 'object',
            example: {
              '7137a47b-5887-4333-8422-146c7d5eee8a': {
                requiredBy: '2022-09-23T09:30:51.190Z',
                recipeId: '1d2ec8fc-e063-4865-9dcd-dcddf4941025',
                price: 1100,
                quantity: 1,
                currency: 'new-currency',
                deliveryTerms: 'new-delivery-terms',
                deliveryAddress: 'new-delivery-address',
                lineText: 'new-line-text',
                exportClassification: 'new-export-classification',
                unitOfMeasure: 'new-unit-of-measure',
                priceType: 'new-price-type',
                confirmedReceiptDate: '2022-09-23T09:30:51.190Z',
                description: 'new-description',
              },
            },
          },
          comments: {
            description: 'comments related to order rejection',
            type: 'string',
            maxLength: 255,
          },
          imageAttachmentId: {
            description: 'id of the attachment',
            type: 'string',
            format: 'uuid',
          },
        },
      },
      OrderAcknowledgement: {
        description: 'An action on an order that causes it to be rejected along with amendment suggestions',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewOrderAcknowledgement' }],
      },
      NewPartCertification: {
        description: 'A new action that registers certification information against a part',
        type: 'object',
        properties: {
          attachmentId: {
            description: 'id of the attachment containing the certification evidence',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            example: '36345f4f-6535-42e2-83f9-79e2e195ec22',
          },
          certificationIndex: {
            description: 'Index in the certification requirement list of the recipe to assign this part to',
            type: 'integer',
            minimum: 0,
            maximum: 9,
          },
          certificationType: {
            description: 'Type of certification Attachment',
            type: 'string',
          },
        },
      },
      PartCertification: {
        description: 'An action that registers certification information against a part',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewPartCertification' }],
      },
      NewBuildSchedule: {
        description:
          'A new action on a build that causes it to be registered on-chain. Build schedule actions also result in the creation of the Part entities that are being constructed in the build',
        type: 'object',
        properties: {
          completionEstimate: {
            description: 'Updated Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
          },
        },
      },
      BuildSchedule: {
        description:
          'An action on a build that causes it to be registered on-chain. Build schedule actions also result in the creation of the Part entities that are being constructed in the build',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewBuildSchedule' }],
      },
      NewBuildStart: {
        description: 'A new action on a build that causes it to be registered on-chain as started',
        type: 'object',
        properties: {
          startedAt: {
            description: 'Date and time at which the build actually started',
            type: 'string',
            format: 'date-time',
          },
          completionEstimate: {
            description: 'Updated Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
          },
        },
      },
      BuildStart: {
        description: 'An action on a build that causes it to be registered on-chain as started',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewBuildStart' }],
      },
      NewBuildProgressUpdate: {
        description: "A new action on a build that updates it's progress",
        type: 'object',
        properties: {
          attachmentId: {
            description: 'Id of an attachment containing build data to register',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            type: 'string',
            nullable: true,
            example: '36345f4f-6535-42e2-83f9-79e2e195ec22',
          },
          completionEstimate: {
            description: 'Updated Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
          },
          updateType: {
            description: 'type of the build process',
            type: 'string',
          },
        },
      },
      BuildProgressUpdate: {
        description: "An action on a build that updates it's progress",
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewBuildProgressUpdate' }],
      },
      NewBuildCompletion: {
        description: 'A new action on a build that marks it as completed',
        type: 'object',
        properties: {
          attachmentId: {
            description: 'Id of an attachment containing build data to register',
            type: 'string',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            nullable: true,
            example: '36345f4f-6535-42e2-83f9-79e2e195ec22',
          },
          completedAt: {
            description: 'Finalised completion date and time',
            type: 'string',
            format: 'date-time',
          },
        },
      },
      BuildCompletion: {
        description: 'An action on a build that marks it as completed',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewBuildCompletion' }],
      },
      NewRecipeCreation: {
        description: 'A new action on a recipe that registers it on-chain',
        type: 'object',
        properties: {},
      },
      RecipeCreation: {
        description: 'An action on a recipe that registers it on-chain',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewRecipeCreation' }],
      },
      NewPartCreation: {
        description: 'A new action on a part that registers it on-chain',
        type: 'object',
        properties: {},
      },
      PartCreation: {
        description: 'An action on a part that registers it on-chain',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewPartCreation' }],
      },
      NewPartMetadataUpdate: {
        description: 'A new action on a part that adds arbitrary metadata',
        type: 'object',
        properties: {
          metadataType: {
            description: 'The type of metadata, for example "location"',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
          },
          attachmentId: {
            description: 'Id of an attachment containing build data to register',
            type: 'string',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            nullable: true,
          },
        },
        example: {
          metadataType: 'location',
          attachmentId: 'ba7a8e74-f553-407c-9de9-0aefdcd5ac6d',
        },
      },
      PartMetadataUpdate: {
        description: 'An action on a build that adds arbitrary metadata',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewPartMetadataUpdate' }],
      },
    },
    ...securitySchemes,
  },
  paths: {},
  security: [{ bearerAuth: [] }],
}

const notRequired = ['imageAttachmentId', 'comments', 'attachmentId']

// make all schema properties required
const makeSchemaPropsRequired = (schemaObj, key) => {
  if (schemaObj.type === 'object' && schemaObj.properties) {
    let props = Object.keys(schemaObj.properties)
    if (key == 'NewOrderAcknowledgement' || key == 'NewBuildProgressUpdate') {
      props = props.filter((value) => !notRequired.includes(value))
    }
    if (props.length > 0) {
      schemaObj.required = props
    }
    let schemas = schemaObj.properties
    for (let key in schemas) {
      makeSchemaPropsRequired(schemas[key], key)
    }
  }
}

let schemas = apiDoc.components.schemas

for (let key in schemas) {
  makeSchemaPropsRequired(schemas[key], key)
}

module.exports = apiDoc
