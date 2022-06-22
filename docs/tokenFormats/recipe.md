# Recipe

Token formats and restrictions for the `Recipe` type

## POST /recipe/{id}/creation

A buyer submitted a recipe that describes how a part will be built by a supplier.

| Inputs | Outputs |
| :----: | :------ |
|   -    | Recipe  |

### Request body

#### Inputs

`-`

#### Outputs

| Roles                | Metadata                                                          |
| :------------------- | :---------------------------------------------------------------- |
| Owner: `BAE`         | `<Literal>` type: `RECIPE`                                        |
| Buyer: `BAE`         | `<Literal>` externalId: `34-396589-2`                             |
| Supplier:`SupplierX` | `<Literal>` transactionId: `09000000-0000-1000-8000-000000000000` |
|                      | `<Literal>` name: `Low-pressure compressor`                       |
|                      | `<Literal>` material: `Titanium`                                  |
|                      | `<Literal>` alloy: `Ti-6Al-4V`                                    |
|                      | `<File>` image: `image.svg`                                       |
|                      | `<File>` requiredCerts: `requiredCerts.json`                      |

### Restrictions

```json
{
  "FixedNumberOfInputs": [
    {
      "num_inputs": 0
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
      "metadata_value": "RECIPE"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "externalId",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "transactionId",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "name",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "material",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "alloy",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "requiredCerts",
      "metadata_value_type": "File"
    },
    {
      "index": 0,
      "metadata_key": "image",
      "metadata_value_type": "File"
    }
  ]
}
```
