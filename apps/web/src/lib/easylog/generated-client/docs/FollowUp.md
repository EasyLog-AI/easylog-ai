# FollowUp

## Properties

| Name                 | Type                                    |
| -------------------- | --------------------------------------- |
| `id`                 | number                                  |
| `name`               | string                                  |
| `slug`               | string                                  |
| `description`        | string                                  |
| `icon`               | string                                  |
| `followUpCategoryId` | number                                  |
| `category`           | [FollowUpCategory](FollowUpCategory.md) |
| `scheme`             | object                                  |
| `canUseJsonTable`    | boolean                                 |
| `createdAt`          | Date                                    |
| `updatedAt`          | Date                                    |
| `entriesCount`       | number                                  |

## Example

```typescript
import type { FollowUp } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  name: null,
  slug: null,
  description: null,
  icon: null,
  followUpCategoryId: null,
  category: null,
  scheme: null,
  canUseJsonTable: null,
  createdAt: null,
  updatedAt: null,
  entriesCount: null
} satisfies FollowUp;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FollowUp;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
