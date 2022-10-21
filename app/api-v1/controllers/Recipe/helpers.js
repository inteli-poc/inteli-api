exports.mapRecipeData = (data) => ({
  externalId: { type: 'LITERAL', value: data.external_id },
  name: { type: 'LITERAL', value: data.name },
  material: { type: 'LITERAL', value: data.material },
  alloy: { type: 'LITERAL', value: data.alloy },
  requiredCerts: { type: 'FILE', value: 'required_certs.json' },
  transactionId: { type: 'LITERAL', value: data.transaction.id.replace(/-/g, '') },
  type: { type: 'LITERAL', value: 'RECIPE' },
  image: { type: 'FILE', value: data.filename },
  price: { type: 'LITERAL', value: data.price },
  id: { type: 'FILE', value: 'id.json' },
  imageAttachmentId: { type: 'FILE', value: 'image_attachment_id.json' },
})
