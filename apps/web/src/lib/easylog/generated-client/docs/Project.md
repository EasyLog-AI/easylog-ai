# Project

## Properties

| Name                 | Type                                             |
| -------------------- | ------------------------------------------------ |
| `id`                 | number                                           |
| `datasourceId`       | number                                           |
| `label`              | string                                           |
| `extraData`          | object                                           |
| `allocationTypes`    | [Array&lt;AllocationType&gt;](AllocationType.md) |
| `allocationsGrouped` | Array&lt;object&gt;                              |
| `createdAt`          | Date                                             |
| `updatedAt`          | Date                                             |

## Example

```typescript
import type { Project } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  datasourceId: null,
  label: null,
  extraData: null,
  allocationTypes: null,
  allocationsGrouped: null,
  createdAt: null,
  updatedAt: null
} satisfies Project;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Project;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
