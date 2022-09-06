const buildPartOutputs = (data, recipe, type, parent_index) => {
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
      ...recipe,
    },
    ...(parent_index && { parent_index: 0 }),
  }
}

exports.mapOrderData = async (data, type) => {
  let inputs
  let outputs
  let output = {}
  output[data.tokenId] = { type: 'TOKEN_ID', value: data.tokenId }
  const recipe = output
  let parent_index
  if (data.latest_token_id) {
    inputs = [data.latest_token_id]
    parent_index = 0
  } else {
    inputs = []
  }
  outputs = [buildPartOutputs(data, recipe, type, parent_index)]
  return {
    ...((type == 'metadata-update' || type == 'certification') && data.binary_blob && { image: data.binary_blob }),
    inputs,
    outputs,
  }
}
