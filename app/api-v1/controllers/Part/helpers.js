const buildPartOutputs = (data, type, parent_index_required) => {
  return {
    roles: {
      Owner: data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'PART' },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
      ...(type == 'order-assignment' && { orderId: { type: 'FILE', value: 'order_id.json' } }),
      ...(type == 'metadata-update' && { image: { type: 'FILE', value: data.filename } }),
      ...(type == 'metadata-update' && { metaDataType: { type: 'LITERAL', value: data.metadataType } }),
      ...(type == 'metadata-update' && { imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' } }),
      actionType: { type: 'LITERAL', value: type },
      id: { type: 'FILE', value: 'id.json' },
    },
    ...(parent_index_required && { parent_index: 0 }),
  }
}

exports.getResponse = async (type, transaction, req) => {
  return {
    id: transaction.id,
    submittedAt: new Date(transaction.created_at).toISOString(),
    status: transaction.status,
    ...(type == 'metadata-update' && { metadata: [req.body] }),
    ...(type == 'certification' && { certificationIndex: req.body.certificationIndex }),
    ...(type == 'order-assignment' && { orderId: req.body.orderId }),
    ...(type == 'order-assignment' && { itemIndex: req.body.itemIndex }),
  }
}

exports.mapOrderData = async (data, type) => {
  let inputs
  let outputs
  let parent_index_required = false
  if (data.latest_token_id) {
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
    ...(type == 'order-assignment' && { orderId: Buffer.from(JSON.stringify(data.order_id)) }),
    ...((type == 'metadata-update' || type == 'certification') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
