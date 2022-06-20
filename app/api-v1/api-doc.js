const { PORT, API_VERSION, API_MAJOR_VERSION } = require('../env')

const apiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'ApiService',
    version: API_VERSION,
  },
  servers: [
    {
      url: `http://localhost:${PORT}/${API_MAJOR_VERSION}`,
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
      },
      NotFoundError: {
        description: 'This resource cannot be found',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Error' }],
      },
      BadRequestError: {
        description: 'The request is invalid',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Error' }],
      },
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Error' }],
      },
      NewRecipe: {
        type: 'object',
        properties: {
          externalId: {
            description: 'id of the recipe in an external ERP',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
          },
          name: {
            description: 'Name of the recipe',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
          },
          imageAttachmentId: {
            description: 'Example image of the item uploaded as an attachment',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          material: {
            description: 'Primary material of the constructed recipe',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
          },
          alloy: {
            description: 'Primary alloy present in the constructed recipe',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
          },
          price: {
            description: 'Price of the recipe. This information is not stored on-chain.',
            type: 'string',
          },
          requiredCerts: {
            description: 'Certification requirements ',
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
          },
        },
      },
      CertificationRequirement: {
        type: 'object',
        properties: {
          description: {
            description: 'Description of the certification requirement',
            allOf: [{ $ref: '#/components/schemas/OnChainLiteral' }],
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
          },
          parts: {
            description: 'Parts created by this build ',
            type: 'array',
            maxItems: 10,
            items: {
              $ref: '#/components/schemas/NewPart',
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
          },
          status: {
            description: 'Status of the build',
            type: 'string',
            enum: ['Created', 'Scheduled', 'Started', 'Completed'],
          },
          completionEstimatedAt: {
            description: 'Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
          },
          startedAt: {
            description: 'Date and time on which the build started. Null if not started',
            type: 'string',
            format: 'date-time',
            nullable: true,
          },
          completedAt: {
            description: 'Date and time at which the build completed. Null if not completed',
            type: 'string',
            format: 'date-time',
            nullable: true,
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
          buildId: {
            description: 'id of the build that produces/produced this part',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          supplier: {
            description: 'Name of the suppler who created the part. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
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
        },
      },
      NewOrder: {
        type: 'object',
        description: 'A new purchase-order to be submitted',
        properties: {
          supplier: {
            description:
              'Name of the supplier who will supply parts from this purchase-order. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
          },
          requiredBy: {
            description: 'Date and time at which the purchase-order must be completed',
            type: 'string',
            format: 'date-time',
          },
          items: {
            type: 'array',
            description: 'List of parts to be supplied',
            maxItems: 10,
            items: {
              description: 'id of the recipe to be built',
              allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            },
          },
        },
      },
      Order: {
        description: 'A purchase-order',
        allOf: [{ $ref: '#/components/schemas/NewOrder' }],
        properties: {
          id: {
            description: 'local id of the purchase-order',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          purchaser: {
            description:
              'Name of the submitter of the purchase-order. This information is not stored directly on-chain',
            type: 'string',
            maxLength: 255,
          },
          status: {
            type: 'string',
            description: 'Status of the purchase-order',
            enum: ['Created', 'Submitted', 'Rejected', 'Amended', 'Accepted'],
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
        example: {
          id: '36345f4f-6535-42e2-83f9-79e2e195ec22',
          status: 'InBlock',
          submittedAt: new Date().toISOString(),
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
      NewOrderAmendment: {
        description: 'A new action on an order that causes it to be amended following a rejection',
        type: 'object',
        properties: {
          requiredBy: {
            description: 'Date and time at which the purchase-order must be completed',
            type: 'string',
            format: 'date-time',
          },
          items: {
            type: 'array',
            description: 'List of parts to be supplied',
            maxItems: 10,
            items: {
              description: 'id of the recipe to be built',
              allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            },
          },
        },
      },
      OrderAmendment: {
        description: 'An action on an order that causes it to be amended following a rejection',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewOrderAmendment' }],
      },
      NewOrderRejection: {
        description: 'A new action on an order that causes it to be rejected along with amendment suggestions',
        type: 'object',
        properties: {
          requiredBy: {
            description: 'Date and time at which the purchase-order must be completed',
            type: 'string',
            format: 'date-time',
          },
          items: {
            type: 'array',
            description: 'List of parts to be supplied',
            maxItems: 10,
            items: {
              description: 'id of the recipe to be built',
              allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            },
          },
        },
      },
      OrderRejection: {
        description: 'An action on an order that causes it to be rejected along with amendment suggestions',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewOrderRejection' }],
      },
      NewPartOrderAssignment: {
        description: 'A new action on a part that causes it to be assigned to an order',
        type: 'object',
        properties: {
          orderId: {
            description: 'id of the order to attach this part to',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          itemIndex: {
            description: 'Index in the item list of the order to assign this part to',
            type: 'integer',
            minimum: 0,
            maximum: 9,
          },
        },
      },
      PartOrderAssignment: {
        description: 'An action on a part that causes it to be assigned to an order',
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/ChainAction' }, { $ref: '#/components/schemas/NewPartOrderAssignment' }],
      },
      NewPartCertification: {
        description: 'A new action that registers certification information against a part',
        type: 'object',
        properties: {
          attachmentId: {
            description: 'id of the attachment containing the certification evidence',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
          },
          certificationIndex: {
            description: 'Index in the certification requirement list of the order-part to assign this part to',
            type: 'integer',
            minimum: 0,
            maximum: 9,
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
            type: 'string',
            allOf: [{ $ref: '#/components/schemas/ObjectReference' }],
            nullable: true,
          },
          completionEstimate: {
            description: 'Updated Date and time at which the build is estimated to finish',
            type: 'string',
            format: 'date-time',
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
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {},
}

// make all schema properties required
const makeSchemaPropsRequired = (schemaObj) => {
  if (schemaObj.type === 'object' && schemaObj.properties) {
    const props = Object.keys(schemaObj.properties)
    if (props.length > 0) {
      schemaObj.required = props
    }
    Object.values(schemaObj.properties).forEach(makeSchemaPropsRequired)
  }
}
Object.values(apiDoc.components.schemas).forEach(makeSchemaPropsRequired)

module.exports = apiDoc
