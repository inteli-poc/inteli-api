# Part

Token formats and restrictions for the `Part` type.

## POST /part/{id}/order-assignment

A supplier assigns a part to an order.

| Inputs      | Outputs     |
| :---------- | :---------- |
| Part, Order | Part, Order |

### Request body

#### Inputs

`PART, ORDER`(any state)

#### Outputs

The `Part` token - add `orderId`.

| Roles                | Metadata                  |
| :------------------- | :------------------------ |
| Owner: `SupplierX`   | `<Literal>` type: `PART`  |
| Buyer: `BAE`         | `<TokenId>` orderId: `29` |
| Supplier:`SupplierX` |                           |

The `Order` token - add `partN`. `N` matches `itemIndex` in the request. The order should already have a `recipeN` for the part.

| Roles                | Metadata                  |
| :------------------- | :------------------------ |
| Owner: `BAE`         | `<Literal>` type: `ORDER` |
| Buyer: `BAE`         | `<TokenId>` partN: `47`   |
| Supplier:`SupplierX` |                           |

### Restrictions

```json
{
  "FixedNumberOfInputs": [
    {
      "num_inputs": 2
    }
  ],
  "FixedNumberOfOutputs": [
    {
      "num_outputs": 2
    }
  ],
  "SenderHasInputRole": [
    {
      "index": 0,
      "role_key": "Supplier"
    },
    {
      "index": 1,
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
    },
    {
      "input_index": 1,
      "input_role_key": "Buyer",
      "output_index": 1,
      "output_role_key": "Buyer"
    },
    {
      "input_index": 1,
      "input_role_key": "Supplier",
      "output_index": 1,
      "output_role_key": "Supplier"
    }
  ],
  "FixedInputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "PART"
    },
    {
      "index": 1,
      "metadata_key": "type",
      "metadata_value": "ORDER"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_index": 0,
      "input_metadata_key": "type",
      "output_index": 0,
      "output_metadata_key": "type"
    },
    {
      "input_index": 1,
      "input_metadata_key": "type",
      "output_index": 1,
      "output_metadata_key": "type"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "orderId",
      "metadata_value_type": "TokenId"
    },
    {
      "index": 1,
      "metadata_key": "partN", // N is 'itemIndex' from request
      "metadata_value_type": "TokenId"
    }
  ]
}
```

## POST /part/{id}/metadata-update

A supplier adds an arbitrary metadata file to a part.

| Inputs | Outputs |
| :----- | :------ |
| Part   | Part    |

### Request body

#### Inputs

`Part` (any state)

#### Outputs

The `Part` token - add `someMetadata`. The metadata key for the file comes from `metadataType` in the request.

| Roles                | Metadata                               |
| :------------------- | :------------------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `PART`               |
| Buyer: `BAE`         | `<File>` someMetadata: `buildData.pdf` |
| Supplier:`SupplierX` |                                        |

### Restrictions

Burning the old + creating the new `Part` token will have the following restrictions:

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
  "SenderHasInputRole": [
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
      "metadata_value": "PART"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_index": 0,
      "input_metadata_key": "type",
      "output_index": 0,
      "output_metadata_key": "type"
    }
  ]
}
```

## POST /part/{id}/certification

A supplier adds a certificate for one of the `requiredCerts` on the recipe for a part.

| Inputs | Outputs |
| :----- | :------ |
| Part   | Part    |

### Request body

#### Inputs

`Part` (any state)

#### Outputs

The `Part` token - add `certificateN`. `N` comes from `certificationIndex` in the request.

| Roles                | Metadata                                 |
| :------------------- | :--------------------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `PART`                 |
| Buyer: `BAE`         | `<File>` certificateN: `certificate.pdf` |
| Supplier:`SupplierX` |                                          |

### Restrictions

Burning the old + creating the new `Part` token will have the following restrictions:

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
  "SenderHasInputRole": [
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
      "metadata_value": "PART"
    }
  ],
  "MatchInputOutputMetadataValue": [
    {
      "input_index": 0,
      "input_metadata_key": "type",
      "output_index": 0,
      "output_metadata_key": "type"
    }
  ]
}
```
