exports.mapRecipeData = (data) => ({
  externalId: { type: 'LITERAL', value: data.external_id },
  name: { type: 'LITERAL', value: data.name },
  material: { type: 'LITERAL', value: data.material },
  alloy: { type: 'LITERAL', value: data.alloy },
  requiredCerts: { type: 'FILE', value: 'required_certs.json' },
  transactionId: { type: 'LITERAL', value: data.transaction.id },
  type: { type: 'LITERAL', value: 'RECIPE' },
  image: { type: 'FILE', value: data.filename },
})
