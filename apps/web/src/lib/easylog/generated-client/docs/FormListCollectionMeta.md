# FormListCollectionMeta

## Properties

| Name          | Type   |
| ------------- | ------ |
| `currentPage` | number |
| `from`        | number |
| `lastPage`    | number |
| `perPage`     | number |
| `to`          | number |
| `total`       | number |

## Example

```typescript
import type { FormListCollectionMeta } from '';

// TODO: Update the object below with actual values
const example = {
  currentPage: null,
  from: null,
  lastPage: null,
  perPage: null,
  to: null,
  total: null
} satisfies FormListCollectionMeta;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FormListCollectionMeta;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
