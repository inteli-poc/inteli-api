const mapRecipeData = (data) => ({
  name: { type: 'LITERAL', value: data.name },
  material: { type: 'LITERAL', value: data.material },
  alloy: { type: 'LITERAL', value: data.alloy },
  price: { type: 'LITERAL', value: data.price },
  requiredCerts: { type: 'LITERAL', value: data.required_certs },
  supplier: { type: 'LITERAL', value: data.supplier },
})

module.exports = {
  mapRecipeData,
}
