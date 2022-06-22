# Build

Token formats and restrictions for the `Build` type.

## POST /build/{id}/schedule

A supplier schedules a build of 1-10 parts. Happens as two separate processes, first create the `build` token then create the `parts` tokens as children of the `build` token.

| Inputs | Outputs |
| :----: | :------ |
|   -    | Build   |

| Inputs                    | Outputs                                   |
| :------------------------ | :---------------------------------------- |
| Build, Recipe0... RecipeN | Build, Recipe0... RecipeN, Part0... PartN |

### Request body 1

Create the `build`.

#### Inputs

`-`

#### Outputs

| Roles                | Metadata                                                          |
| :------------------- | :---------------------------------------------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `BUILD`                                         |
| Buyer: `BAE`         | `<Literal>` status: `scheduled`                                   |
| Supplier:`SupplierX` | `<Literal>` transactionId: `09000000-0000-1000-8000-000000000000` |
|                      | `<Literal>` completionEstimate: `2023-01-01`                      |
|                      | `<Literal>` externalId: `34-396589-2`                             |

### Restrictions

The new `Build` token will have the following restrictions:

```json
{
  "SenderHasOutputRole": [
    {
      "index": 0,
      "role_key": "Supplier"
    }
  ],
  "OutputHasRole": [
    {
      "index": 0,
      "role_key": "Buyer"
    }
  ],
  "FixedOutputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "BUILD"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "scheduled"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "completionEstimate",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "transactionId",
      "metadata_value_type": "Literal"
    },
    {
      "index": 0,
      "metadata_key": "externalId",
      "metadata_value_type": "Literal"
    }
  ]
}
```

### Request body 2

Create the `parts`.

#### Inputs

`ORDER`

`[RECIPE]`
The latest token of each recipe in the build is consumed.

#### Outputs

`[RECIPE]`
So that each recipe is available to be used again, a new token for each recipe in the build is created.

| Roles                | Metadata                   |
| :------------------- | :------------------------- |
| Buyer: `BAE`         | `<Literal>` type: `RECIPE` |
| Supplier:`SupplierX` |                            |

So that the build is available to be used again, a new token for the build is created.

| Roles                | Metadata                  |
| :------------------- | :------------------------ |
| Owner: `SupplierX`   | `<Literal>` type: `BUILD` |
| Buyer: `BAE`         |                           |
| Supplier:`SupplierX` |                           |

The `Part` token. One for each recipe in the build. `recipeId: <TokenId>` matches a recipe `<TokenId>` from the `inputs`. `buildId: <TokenId>` matches the build `<TokenId>` from the `inputs`.

| Roles                | Metadata                    |
| :------------------- | :-------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `PART`    |
| Buyer: `BAE`         | `<TokenId>` recipeId: `125` |
| Supplier:`SupplierX` | `<TokenId>` buildId: `205`  |

### Restrictions

Burning the old + creating the new `Build` token will have the following restrictions:

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
      "metadata_value": "BUILD"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "scheduled"
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

For the range of `Recipe` input+output tokens in the build, the following restrictions will apply:

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

For each `Part`, the following restrictions will apply:

```json
{
  "SenderHasOutputRole": [
    {
      "role_key": "Supplier"
    }
  ],
  "OutputHasRole": [
    {
      "index": 0,
      "role_key": "Buyer"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "metadata_key": "recipeId",
      "metadata_value_type": "TokenId"
    },
    {
      "metadata_key": "buildId",
      "metadata_value_type": "TokenId"
    }
  ],
  "FixedOutputMetadataValue": [
    {
      "metadata_key": "type",
      "metadata_value": "PART"
    }
  ]
}
```

## POST /build/{id}/start

A supplier starts a build of 1-10 parts.

| Inputs | Outputs |
| :----- | :------ |
| Build  | Build   |

### Request body

#### Inputs

`/build/{id}/schedule`

#### Outputs

| Roles                | Metadata                                     |
| :------------------- | :------------------------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `BUILD`                    |
| Buyer: `BAE`         | `<Literal>` status: `started`                |
| Supplier:`SupplierX` | `<Literal>` startedAt: `2022-06-10`          |
|                      | `<Literal>` completionEstimate: `2023-01-01` |

### Restrictions

Burning the old + creating the new `Build` token will have the following restrictions:

```json
{
  "FixedNumberOfInputs": [
    {
      "num_inputs": 1
    }
  ],
  "FixedInputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "BUILD"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "scheduled"
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
  "FixedOutputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "started"
    }
  ]
}
```

## POST /build/{id}/progress-update

A supplier updates progress on a build.

| Inputs | Outputs |
| :----- | :------ |
| Build  | Build   |

### Request body

#### Inputs

`/build/{id}/start || /build/{id}/progress-update`

#### Outputs

| Roles                | Metadata                                     |
| :------------------- | :------------------------------------------- |
| Owner: `SupplierX`   | `<Literal>` type: `BUILD`                    |
| Buyer: `BAE`         | `<File>` buildDataX: `buildData.pdf`         |
| Supplier:`SupplierX` | `<Literal>` completionEstimate: `2023-01-01` |

### Restrictions

Burning the old + creating the new `Build` token will have the following restrictions:

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
  "FixedInputMetadataValue": [
    {
      "index": 0,
      "metadata_key": "type",
      "metadata_value": "BUILD"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "started"
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
    },
    {
      "input_index": 0,
      "input_metadata_key": "status",
      "output_index": 0,
      "output_metadata_key": "status"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "completionEstimate",
      "metadata_value_type": "Literal"
    }
  ]
}
```

## POST /order/{id}/completion

A supplier completes an order.

| Inputs | Outputs |
| :----- | :------ |
| Build  | Build   |

### Request body

#### Inputs

`/order/{id}/start || /order/{id}/progress-update`

#### Outputs

| Roles                | Metadata                              |
| :------------------- | :------------------------------------ |
| Owner: `BAE`         | `<Literal>` type: `BUILD`             |
| Buyer: `BAE`         | `<Literal>` status: `completed`       |
| Supplier:`SupplierX` | `<Literal>` completedAt: `2023-01-01` |
|                      | `<File>` buildDataX: `buildData.pdf`  |

### Restrictions

Burning the old + creating the new `Build` token will have the following restrictions:

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
      "metadata_value": "BUILD"
    },
    {
      "index": 0,
      "metadata_key": "status",
      "metadata_value": "started"
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
      "metadata_value": "completed"
    }
  ],
  "FixedOutputMetadataValueType": [
    {
      "index": 0,
      "metadata_key": "completedAt",
      "metadata_value_type": "Literal"
    }
  ]
}
```
