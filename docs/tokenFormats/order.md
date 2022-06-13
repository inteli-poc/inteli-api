# Order

Token formats and restrictions for the `Order` type.

## POST /order/{id}/submission

A buyer submits an order consisting of 1-10 recipes from a supplier.

| Inputs             | Outputs                   |
| :----------------- | :------------------------ |
| Recipe0... RecipeN | Order, Recipe0... RecipeN |

### Request body

#### Inputs

`[RECIPE]`
The latest token of each recipe in the order is consumed.

#### Outputs

`[RECIPE]`
So that each recipe is available to be used again, a new token for each recipe in the order is created.

| Roles                | Metadata                   |
| :------------------- | :------------------------- |
| Owner: `BAE`         | `<Literal>` type: `RECIPE` |
| Buyer: `BAE`         |                            |
| Supplier:`SupplierX` |                            |

The `ORDER` token. Each `recipeN: <TokenId>` matches a` <TokenId>` from the `inputs`.

| Roles                | Metadata                                                          |
| :------------------- | :---------------------------------------------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `ORDER`                                         |
| Buyer: `BAE`         | `<Literal>` status: `submitted`                                   |
| Supplier:`SupplierX` | `<Literal>` transactionId: `09000000-0000-1000-8000-000000000000` |
|                      | `<Literal>` requiredBy: `2023-01-01`                              |
|                      | `<TokenId>` recipe0: `100`                                        |
|                      | `<TokenId>` recipe1: `112`                                        |
|                      | `<TokenId>` recipe2: `163`                                        |
|                      | `<TokenId>` recipe3: `141`                                        |
|                      | `<TokenId>` recipe4: `95`                                         |
|                      | `<TokenId>` recipe5: `156`                                        |
|                      | `<TokenId>` recipe6: `47`                                         |
|                      | `<TokenId>` recipe7: `108`                                        |
|                      | `<TokenId>` recipe8: `34`                                         |
|                      | `<TokenId>` recipe9: `12`                                         |

### Restrictions

The new `Order` token will have the following restrictions:

```json
{
  "SenderHasOutputRole": [
    {
      "index": 0,
      "role_key": "Buyer"
    }
  ],
  "OutputHasRole": [
    {
      "index": 0,
      "role_key": "Supplier"
    }
  ],
  "FixedOutputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "ORDER"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "submitted"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "requiredBy",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "transactionId",
      "metadata_value_type": "Literal"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "recipe0",
      "metadata_value_type": "TokenId"
    },
    // ... for every recipe in the order
    {
      "index": 0,
      "metadata_key": "recipeN",
      "metadata_value_type": "TokenId"
    }
  ]
}
```

For the range of `Recipe` input+output tokens in the order, the following restrictions will apply:

```json
{
  "SenderHasInputRole": [
    {
      "role_key": "Buyer"
    }
  ],
  "MatchInputOutputRole": [
    {
      "input_role_key": "Supplier",
      "output_role_key": "Supplier"
    }
  ],
  "FixedInputMetadataValue": [
    {
      "metadata_key": "type",
      "metadata_value": "RECIPE"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_metadata_key": "type",
      "output_metadata_key": "type"
    }
  ]
}
```

## POST /order/{id}/rejection

A supplier rejects an order, along with amendment suggestions - a new list of recipes and `requiredBy` date.

| Inputs                    | Outputs                   |
| :------------------------ | :------------------------ |
| Order, Recipe0... RecipeN | Order, Recipe0... RecipeN |

### Request body

#### Inputs

`/order/{id}/submission`

`[RECIPE]`
The latest token of each recipe in the order is consumed.

#### Outputs

`[RECIPE]`
So that each recipe is available to be used again, a new token for each recipe in the order is created.

| Roles                | Metadata                   |
| :------------------- | :------------------------- |
| Owner: `BAE`         | `<Literal>` type: `RECIPE` |
| Buyer: `BAE`         |                            |
| Supplier:`SupplierX` |                            |

The `ORDER` token. Each `recipeN: <TokenId>` matches a `<TokenId>`from the `inputs`.

| Roles                | Metadata                             |
| :------------------- | :----------------------------------- |
| Owner: `BAE`         | `<Literal>` type: `ORDER`            |
| Buyer: `BAE`         | `<Literal>` status: `rejected`       |
| Supplier:`SupplierX` | `<Literal>` requiredBy: `2023-01-01` |
|                      | `<TokenId>` recipe0: `100`           |
|                      | `<TokenId>` recipe1: `112`           |
|                      | `<TokenId>` recipe2: `163`           |
|                      | `<TokenId>` recipe3: `141`           |
|                      | `<TokenId>` recipe4: `95`            |
|                      | `<TokenId>` recipe5: `156`           |
|                      | `<TokenId>` recipe6: `47`            |
|                      | `<TokenId>` recipe7: `108`           |
|                      | `<TokenId>` recipe8: `34`            |
|                      | `<TokenId>` recipe9: `12`            |

### Restrictions

Burning the old + creating the new `Order` token will have the following restrictions:

```json
{
  "SenderHasOutputRole": [
    {
      "index": 0,
      "role_key": "Supplier"
    }
  ],
  "MatchInputOutputRole": [
    {
      "input_index": 0,
      "input_role_key": "Buyer",
      "output_index": 0,
      "output_role_key": "Buyer"
    },
    {
      "input_index": 0,
      "input_role_key": "Supplier",
      "output_index": 0,
      "output_role_key": "Supplier"
    }
  ],
  "FixedInputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "ORDER"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "submitted"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_index": 0,
      "input_metadata_key": "type",
      "output_index": 0,
      "output_metadata_key": "type"
    }
  ],
  "FixedOutputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "rejected"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "requiredBy",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "recipe0",
      "metadata_value_type": "TokenId"
    },
    // ... for every recipe in the order
    {
      "index": 0,
      "metadata_key": "recipeN",
      "metadata_value_type": "TokenId"
    }
  ]
}
```

For the range of `Recipe` input+output tokens in the order, the following restrictions will apply:

```json
{
  "SenderHasInputRole": [
    {
      "role_key": "Supplier"
    }
  ],
  "MatchInputOutputRole": [
    {
      "input_role_key": "Buyer",
      "output_role_key": "Buyer"
    }
  ],
  "FixedInputMetadataValue": [
    {
      "metadata_key": "type",
      "metadata_value": "RECIPE"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_metadata_key": "type",
      "output_metadata_key": "type"
    }
  ]
}
```

## POST /order/{id}/amendment

A buyer agrees to amend an order following a supplier's rejection.

### Request body

#### Inputs

`/order/{id}/rejection`

| Inputs | Outputs |
| :----- | :------ |
| Order  | Order   |

#### Outputs

| Roles                | Metadata                      |
| :------------------- | :---------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `ORDER`     |
| Buyer: `BAE`         | `<Literal>` status: `amended` |
| Supplier:`SupplierX` |                               |

### Restrictions

```json
{
  "FixedNumberOfInputs": [
    {
      "num_inputs": 1
    }
  ],
  "FixedNumberOfOutputs": [
    {
      "num_outputs": 1
    }
  ],
  "SenderHasOutputRole": [
    {
      "index": 0,
      "role_key": "Buyer"
    }
  ],
  "MatchInputOutputRole": [
    {
      "input_index": 0,
      "input_role_key": "Buyer",
      "output_index": 0,
      "output_role_key": "Buyer"
    },
    {
      "input_index": 0,
      "input_role_key": "Supplier",
      "output_index": 0,
      "output_role_key": "Supplier"
    }
  ],
  "FixedInputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "ORDER"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "amended"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_index": 0,
      "input_metadata_key": "type",
      "output_index": 0,
      "output_metadata_key": "type"
    }
  ],
  "FixedOutputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "amended"
    }
  ]
}
```

## POST /order/{id}/acceptance

A supplier accepts an order, signifying their intent to fulfil the order.

| Inputs | Outputs |
| :----- | :------ |
| Order  | Order   |

### Request body

#### Inputs

`/order/{id}/submission || /order/{id}/amendment`

#### Outputs

| Roles                | Metadata                       |
| :------------------- | :----------------------------- |
| Owner: `BAE`         | `<Literal>` type: `ORDER`      |
| Buyer: `BAE`         | `<Literal>` status: `accepted` |
| Supplier:`SupplierX` |                                |

### Restrictions

```json
{
  "FixedNumberOfInputs": [
    {
      "num_inputs": 1
    }
  ],
  "FixedNumberOfOutputs": [
    {
      "num_outputs": 1
    }
  ],
  "SenderHasOutputRole": [
    {
      "index": 0,
      "role_key": "Supplier"
    }
  ],
  "BinaryBoolean": [
    {
      "operator": "OR",
      "restriction_a": {
        "FixedInputMetadataValue": {
          "index": 0,
          "metadata_key": "status",
          "metadata_value": "submitted"
        }
      },
      "restriction_b": {
        "FixedInputMetadataValue": {
          "index": 0,
          "metadata_key": "status",
          "metadata_value": "amended"
        }
      }
    }
  ],
  "FixedInputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "ORDER"
    }
  ],
  "MatchInputOutputRole": [
    {
      "input_index": 0,
      "input_role_key": "Buyer",
      "output_index": 0,
      "output_role_key": "Buyer"
    },
    {
      "input_index": 0,
      "input_role_key": "Supplier",
      "output_index": 0,
      "output_role_key": "Supplier"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_index": 0,
      "input_metadata_key": "type",
      "output_index": 0,
      "output_metadata_key": "type"
    }
  ],
  "FixedOutputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "accepted"
    }
  ]
}
```
