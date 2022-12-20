const db = require('../../../db')
const { runProcess } = require('../../../utils/dscp-api')
const identity = require('../../services/identityService')
const jsConvert = require('js-convert-case')
const {
  mapPartData,
  getResponse,
  getResultForPartGet,
  getResultForPartTransactionGet,
  checkAttachment,
  insertCertificationIntoPart,
} = require('./helpers')
const { BadRequestError, NotFoundError } = require('../../../utils/errors')

module.exports = {
  post: async function (req) {
    if (!req.body) {
      throw new BadRequestError('missing req.body')
    }
    const recipeId = req.body.recipeId
    const [recipe] = await db.getRecipeByIDdb(recipeId)
    if (!recipe) {
      throw new BadRequestError('recipe not found')
    }
    const part = {}
    part.supplier = recipe.supplier
    part.certifications = JSON.stringify(recipe.required_certs)
    part.required_by = req.body.requiredBy
    part.recipe_id = req.body.recipeId
    part.price = req.body.price
    part.quantity = req.body.quantity
    part.delivery_terms = req.body.deliveryTerms
    part.delivery_address = req.body.deliveryAddress
    part.price_type = req.body.priceType
    part.unit_of_measure = req.body.unitOfMeasure
    part.export_classification = req.body.exportClassification
    part.line_text = req.body.lineText
    part.currency = req.body.currency
    part.confirmed_receipt_date = req.body.confirmedReceiptDate
    part.description = req.body.description
    part.forecast_delivery_date = req.body.confirmedReceiptDate
    const [result] = await db.postPartDb(part)
    req.body.certifications = recipe.required_certs
    req.body.metadata = null
    const { alias: supplierAlias } = await identity.getMemberByAddress(req, part.supplier)
    req.body.supplier = supplierAlias
    return {
      status: 201,
      response: {
        ...result,
        ...req.body,
      },
    }
  },
  getAll: async function (req) {
    let parts
    let metadataType = req.query.metadataType
    parts = await db.getParts()
    let result = await getResultForPartGet(parts, req, metadataType)
    return {
      status: 200,
      response: result,
    }
  },
  get: async function (req) {
    let { id } = req.params
    if (!id) {
      throw new BadRequestError('missing params')
    }
    let parts
    parts = await db.getPartById(id)
    let result = await getResultForPartGet(parts, req)
    return {
      status: 200,
      response: result[0],
    }
  },
  transaction: {
    getAll: (type) => {
      return async (req) => {
        let { id } = req.params
        if (!id) {
          throw new BadRequestError('missing params')
        }
        let partTransanctions = await db.getPartTransactions(id, type)
        let modifiedPartTransactions = await getResultForPartTransactionGet(partTransanctions, type, id)
        return {
          status: 200,
          response: modifiedPartTransactions,
        }
      }
    },
    get: (type) => {
      return async (req) => {
        let { id } = req.params
        if (!id) {
          throw new BadRequestError('missing params')
        }
        let transactionId
        switch (type) {
          case 'metadata-update':
            transactionId = req.params.updateId
            break
          case 'amendment':
            transactionId = req.params.amendmentId
            break
          case 'acknowledgement':
            transactionId = req.params.acknowledgementId
            break
          case 'certification':
            transactionId = req.params.certificationId
            break
        }
        if (!transactionId) {
          throw new BadRequestError('missing params')
        }
        let partTransanctions = await db.getPartTransactionsById(transactionId, id, type)
        let modifiedPartTransactions = await getResultForPartTransactionGet(partTransanctions, type, id)
        return {
          status: 200,
          response: modifiedPartTransactions[0],
        }
      }
    },
    create: (type) => {
      return async (req) => {
        let binary_blob
        let filename
        let metadataType
        let imageAttachmentId
        let attachment
        let certificationIndex
        let build
        let updateOriginalTokenId
        let latest_token_id
        let certificationType
        const { id } = req.params
        if (!id) {
          throw new BadRequestError('missing params')
        }
        let [part] = await db.getPartById(id)
        if (!part) {
          throw new NotFoundError('part')
        }
        switch (type) {
          case 'metadata-update':
            metadataType = req.body.metadataType
            imageAttachmentId = req.body.attachmentId
            if (part.metadata) {
              part.metadata = part.metadata.concat([req.body])
            } else {
              part.metadata = [req.body]
            }
            attachment = await db.getAttachment(req.body.attachmentId)
            if (attachment.length == 0) {
              throw new NotFoundError('attachment')
            }
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
          case 'certification':
            certificationIndex = req.body.certificationIndex
            imageAttachmentId = req.body.attachmentId
            certificationType = req.body.certificationType
            await insertCertificationIntoPart(part, certificationIndex, imageAttachmentId)
            ;[build] = await db.getBuildById(part.build_id)
            build.update_type = certificationType
            latest_token_id = build.latest_token_id
            updateOriginalTokenId = false
            await db.updateBuild(build, latest_token_id, updateOriginalTokenId)
            attachment = await db.getAttachment(req.body.attachmentId)
            await checkAttachment(attachment)
            binary_blob = attachment[0].binary_blob
            filename = attachment[0].filename
            break
          case 'acknowledgement':
            part = { ...part, ...jsConvert.snakeKeys(req.body) }
            break
          case 'amendment':
            part = { ...part, ...jsConvert.snakeKeys(req.body) }
            break
          case 'update-delivery-date':
            part.forecast_delivery_date = req.body.forecastedDeliveryDate
            break
        }
        const [recipe] = await db.getRecipeByIDdb(part.recipe_id)
        if (!recipe) {
          throw new BadRequestError('recipe not found')
        }
        const buyer = recipe.owner
        const supplier = recipe.supplier
        const transaction = await db.insertPartTransaction(id, type, 'Submitted')
        let payload
        try {
          payload = await mapPartData(
            {
              ...part,
              transaction,
              supplier,
              buyer,
              binary_blob,
              filename,
              metadataType,
              imageAttachmentId,
              certificationIndex,
              certificationType,
            },
            type
          )
        } catch (err) {
          await db.removeTransactionPart(transaction.id)
          throw err
        }
        try {
          const result = await runProcess(payload, req.token)
          if (Array.isArray(result)) {
            await db.updatePartTransaction(transaction.id, result[0])
            let updateOriginalTokenIdForOrder = false
            if (!part.latest_token_id) {
              updateOriginalTokenIdForOrder = true
              await db.updatePart(part, result[0], updateOriginalTokenIdForOrder)
            } else {
              await db.updatePart(part, result[0], updateOriginalTokenIdForOrder)
            }
          } else {
            await db.removeTransactionPart(transaction.id)
            return {
              status: 400,
              response: {
                message: 'No Token Ownership',
              },
            }
          }
        } catch (err) {
          await db.removeTransactionPart(transaction.id)
          throw err
        }
        return {
          status: 201,
          response: await getResponse(type, transaction, req),
        }
      }
    },
  },
}
