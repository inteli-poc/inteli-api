const db = require('../../../db')
const identity = require('../../services/identityService')
const { NotFoundError, InternalError, NothingToProcess, NoTokenError } = require('../../../utils/errors')
const { getMetadata } = require('../../../utils/dscp-api')

const buildPartOutputs = (data, type, parent_index_required) => {
  return {
    roles: {
      Owner: type == 'acknowledgement' || data.metadataType == 'finalLocation' ? data.buyer : data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'PART' },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
      ...((type == 'metadata-update' || type == 'certification') && { image: { type: 'FILE', value: data.filename } }),
      ...(type == 'metadata-update' && { metaDataType: { type: 'LITERAL', value: data.metadataType } }),
      ...((type == 'metadata-update' || type == 'certification') && {
        imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' },
      }),
      ...(type == 'certification' && {
        certificationIndex: { type: 'LITERAL', value: JSON.stringify(data.certificationIndex) },
      }),
      ...(type == 'certification' && {
        certificationType: { type: 'LITERAL', value: JSON.stringify(data.certificationType) },
      }),
      actionType: { type: 'LITERAL', value: type },
      id: { type: 'FILE', value: 'id.json' },
      price: { type: 'LITERAL', value: data.price.toString() },
      quantity: { type: 'LITERAL', value: data.quantity.toString() },
      description: { type: 'LITERAL', value: data.description },
      deliveryTerms: { type: 'LITERAL', value: data.delivery_terms },
      deliveryAddress: { type: 'LITERAL', value: data.delivery_address },
      priceType: { type: 'LITERAL', value: data.price_type },
      confirmedReceiptDate: { type: 'LITERAL', value: data.confirmed_receipt_date },
      unitOfMeasure: { type: 'LITERAL', value: data.unit_of_measure },
      currency: { type: 'LITERAL', value: data.currency },
      exportClassification: { type: 'LITERAL', value: data.export_classification },
      lineText: { type: 'LITERAL', value: data.line_text },
      requiredBy: { type: 'LITERAL', value: data.required_by },
      recipeId: { type: 'FILE', value: 'recipe_id.json' },
      forecastedDeliveryDate: { type: 'LITERAL', value: data.forecast_delivery_date },
    },
    ...(parent_index_required && { parent_index: 0 }),
  }
}

exports.getResponse = async (type, transaction, req) => {
  return {
    id: req.params.id,
    transactionId: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...(type == 'metadata-update' && { metadataType: req.body.metadataType }),
    ...((type == 'metadata-update' || type == 'certification') && { attachmentId: req.body.attachmentId }),
    ...(type == 'certification' && { certificationIndex: req.body.certificationIndex }),
    ...(type == 'certification' && { certificationType: req.body.certificationType }),
    ...(type == 'update-delivery-date' && { forecastedDeliveryDate: req.body.forecastedDeliveryDate }),
  }
}

exports.getResultForPartGet = async (parts, req) => {
  if (parts.length == 0) {
    throw new NotFoundError('parts')
  }
  const result = await Promise.all(
    parts.map(async (item) => {
      const newItem = {}
      const { alias: supplierAlias } = await identity.getMemberByAddress(req, item.supplier)
      newItem['supplier'] = supplierAlias
      newItem['buildId'] = item.build_id
      newItem['recipeId'] = item.recipe_id
      newItem['id'] = item.id
      newItem['certifications'] = item.certifications
      newItem['metadata'] = item.metadata
      newItem['price'] = item.price
      newItem['quantity'] = item.quantity
      newItem['deliveryTerms'] = item.delivery_terms
      newItem['description'] = item.description
      newItem['deliveryAddress'] = item.delivery_address
      newItem['priceType'] = item.price_type
      newItem['unitOfMeasure'] = item.unit_of_measure
      newItem['exportClassification'] = item.export_classification
      newItem['lineText'] = item.line_text
      newItem['currency'] = item.currency
      newItem['confirmedReceiptDate'] = item.confirmed_receipt_date.toISOString()
      newItem['requiredBy'] = item.required_by.toISOString()
      newItem['forecastedDeliveryDate'] = item.forecast_delivery_date.toISOString()
      return newItem
    })
  )
  return { status: 200, response: result }
}

exports.insertCertificationIntoPart = async (part, certificationIndex, attachmentId) => {
  if (!part.certifications) {
    throw new NotFoundError('part certifications')
  }
  if (certificationIndex > part.certifications.length) {
    throw new InternalError({ message: 'certification index out of range' })
  }
  for (let index = 0; index <= part.certifications.length; index++) {
    if (index == certificationIndex) {
      part.certifications[index].certificationAttachmentId = attachmentId
    }
  }
}

exports.checkAttachment = async (attachment) => {
  if (attachment.length == 0) {
    throw new NotFoundError('attachment')
  }
}

async function gatherPartDetails(index, newItem) {
  let requiredBy = await getMetadata(index, 'requiredBy')
  let quantity = await getMetadata(index, 'quantity')
  let price = await getMetadata(index, 'price')
  let recipeId = await getMetadata(index, 'recipeId')
  let description = await getMetadata(index, 'description')
  let deliveryTerms = await getMetadata(index, 'deliveryTerms')
  let deliveryAddress = await getMetadata(index, 'deliveryAddress')
  let priceType = await getMetadata(index, 'priceType')
  let unitOfMeasure = await getMetadata(index, 'unitOfMeasure')
  let currency = await getMetadata(index, 'currency')
  let exportClassification = await getMetadata(index, 'exportClassification')
  let lineText = await getMetadata(index, 'lineText')
  let confirmedReceiptDate = await getMetadata(index, 'confirmedReceiptDate')
  let forecastedDeliveryDate = await getMetadata(index, 'forecastedDeliveryDate')
  forecastedDeliveryDate = forecastedDeliveryDate.data
  requiredBy = requiredBy.data
  quantity = quantity.data
  price = price.data
  recipeId = recipeId.data
  description = description.data
  deliveryTerms = deliveryTerms.data
  deliveryAddress = deliveryAddress.data
  priceType = priceType.data
  unitOfMeasure = unitOfMeasure.data
  currency = currency.data
  exportClassification = exportClassification.data
  lineText = lineText.data
  confirmedReceiptDate = confirmedReceiptDate.data
  newItem.description = description
  newItem.deliveryTerms = deliveryTerms
  newItem.deliveryAddress = deliveryAddress
  newItem.priceType = priceType
  newItem.currency = currency
  newItem.unitOfMeasure = unitOfMeasure
  newItem.exportClassification = exportClassification
  newItem.lineText = lineText
  newItem.confirmedReceiptDate = confirmedReceiptDate
  newItem.recipeId = recipeId
  newItem.price = price
  newItem.quantity = quantity
  newItem.requiredBy = requiredBy
  newItem.forecastedDeliveryDate = forecastedDeliveryDate
}

exports.getResultForPartTransactionGet = async (partTransanctions, type, id) => {
  if (partTransanctions.length == 0) {
    throw new NotFoundError('part_transactions')
  }
  let [part] = await db.getPartById(id)
  if (!part) {
    throw new NotFoundError('part')
  }
  const modifiedPartTransactions = await Promise.all(
    partTransanctions.map(async (item) => {
      let attachmentId
      let metadataType
      let certificationIndex
      let certificationType
      let forecastedDeliveryDate
      const newItem = {}
      newItem['transactionId'] = item['id']
      newItem['id'] = item['part_id']
      newItem['submittedAt'] = item['created_at'].toISOString()
      newItem['status'] = item['status']
      switch (type) {
        case 'metadata-update':
          metadataType = await getMetadata(item.token_id, 'metaDataType')
          metadataType = metadataType.data
          attachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
          attachmentId = attachmentId.data
          newItem['metadataType'] = metadataType
          newItem['attachmentId'] = attachmentId
          break
        case 'certification':
          certificationIndex = await getMetadata(item.token_id, 'certificationIndex')
          certificationIndex = certificationIndex.data
          attachmentId = await getMetadata(item.token_id, 'imageAttachmentId')
          attachmentId = attachmentId.data
          certificationType = await getMetadata(item.token_id, 'certificationType')
          certificationType = certificationType.data
          newItem['certificationIndex'] = certificationIndex
          newItem['attachmentId'] = attachmentId
          newItem['certificationType'] = certificationType
          break
        case 'acknowledgement':
          await gatherPartDetails(item.token_id, newItem)
          break
        case 'amendment':
          await gatherPartDetails(item.token_id, newItem)
          break
        case 'update-delivery-date':
          forecastedDeliveryDate = await getMetadata(item.token_id, 'forecastedDeliveryDate')
          forecastedDeliveryDate = forecastedDeliveryDate.data
          newItem['forecastedDeliveryDate'] = forecastedDeliveryDate
          break
      }
      return newItem
    })
  )
  return modifiedPartTransactions
}
exports.mapPartData = async (data, type) => {
  if (!data.recipe_id) throw new NothingToProcess()
  const records = await db.getRecipeByIDdb(data.recipe_id)
  const tokenIds = records.map((el) => el.latest_token_id)
  if (!tokenIds.every(Boolean)) throw new NoTokenError('recipes')
  let inputs
  let outputs
  let parent_index_required = false
  if (type != 'Creation') {
    inputs = [data.latest_token_id]
    parent_index_required = true
  } else {
    inputs = []
  }
  outputs = [buildPartOutputs(data, type, parent_index_required)]
  return {
    id: Buffer.from(JSON.stringify(data.id)),
    ...((type == 'metadata-update' || type == 'certification') && {
      imageAttachmentId: Buffer.from(JSON.stringify(data.imageAttachmentId)),
    }),
    recipeId: Buffer.from(JSON.stringify(data.recipe_id)),
    ...(type == 'order-assignment' && { orderId: Buffer.from(JSON.stringify(data.order_id)) }),
    ...((type == 'metadata-update' || type == 'certification') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
