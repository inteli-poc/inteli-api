const buildPartOutputs = (data, type, parent_index) => {
  return {
    roles: {
      Owner: data.supplier,
      Buyer: data.buyer,
      Supplier: data.supplier,
    },
    metadata: {
      type: { type: 'LITERAL', value: 'PART' },
      transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/[-]/g, '') },
      ...(type == 'metadata-update' && { image: { type: 'FILE', value: data.filename } }),
      ...(type == 'metadata-update' && { metaDataType: { type: 'LITERAL', value: data.metadataType } }),
      ...(type == 'metadata-update' && { imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' } }),
      id: { type: 'FILE', value: 'id.json' },
    },
    ...(parent_index && { parent_index: 0 }),
  }
}

exports.mapOrderData = async (data, type) => {
  let inputs
  let outputs
  let parent_index
  if (data.latest_token_id) {
    inputs = [data.latest_token_id]
    parent_index = 0
  } else {
    inputs = []
  }
  outputs = [buildPartOutputs(data, type, parent_index)]
  return {
    id: Buffer.from(JSON.stringify(data.id)),
    ...((type == 'metadata-update' || type == 'certification') && {
      imageAttachmentId: Buffer.from(JSON.stringify(data.imageAttachmentId)),
    }),
    ...((type == 'metadata-update' || type == 'certification') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
