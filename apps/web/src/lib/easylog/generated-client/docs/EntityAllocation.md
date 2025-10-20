# EntityAllocation

## Properties

| Name         | Type                                                 |
| ------------ | ---------------------------------------------------- |
| `id`         | number                                               |
| `projectId`  | number                                               |
| `resourceId` | number                                               |
| `group`      | string                                               |
| `type`       | string                                               |
| `comment`    | string                                               |
| `start`      | Date                                                 |
| `end`        | Date                                                 |
| `fields`     | { [key: string]: string; }                           |
| `parentId`   | number                                               |
| `children`   | [Array&lt;EntityAllocation&gt;](EntityAllocation.md) |
| `createdAt`  | Date                                                 |
| `updatedAt`  | Date                                                 |

## Example

```typescript
import type { EntityAllocation } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  projectId: null,
  resourceId: null,
  group: null,
  type: null,
  comment: null,
  start: null,
  end: null,
  fields: null,
  parentId: null,
  children: null,
  createdAt: null,
  updatedAt: null
} satisfies EntityAllocation;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityAllocation;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
