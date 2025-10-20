# Entity

## Properties

| Name              | Type                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `id`              | number                                                                 |
| `types`           | Array&lt;string&gt;                                                    |
| `categoryId`      | number                                                                 |
| `name`            | string                                                                 |
| `description`     | string                                                                 |
| `slug`            | string                                                                 |
| `resourceGroups`  | [Array&lt;EntityResourceGroupsInner&gt;](EntityResourceGroupsInner.md) |
| `extraDataFields` | { [key: string]: string; }                                             |
| `allocationTypes` | [Array&lt;EntityResourceGroupsInner&gt;](EntityResourceGroupsInner.md) |
| `fields`          | Array&lt;object&gt;                                                    |
| `createdAt`       | Date                                                                   |
| `updatedAt`       | Date                                                                   |

## Example

```typescript
import type { Entity } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  types: null,
  categoryId: null,
  name: null,
  description: null,
  slug: null,
  resourceGroups: null,
  extraDataFields: null,
  allocationTypes: null,
  fields: null,
  createdAt: null,
  updatedAt: null
} satisfies Entity;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Entity;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
