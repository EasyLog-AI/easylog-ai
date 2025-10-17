# UpdateFollowUpInput

## Properties

| Name                 | Type    |
| -------------------- | ------- |
| `name`               | string  |
| `slug`               | string  |
| `description`        | string  |
| `followUpCategoryId` | number  |
| `icon`               | string  |
| `scheme`             | object  |
| `canUseJsonTable`    | boolean |

## Example

```typescript
import type { UpdateFollowUpInput } from '';

// TODO: Update the object below with actual values
const example = {
  name: null,
  slug: null,
  description: null,
  followUpCategoryId: null,
  icon: null,
  scheme: null,
  canUseJsonTable: null
} satisfies UpdateFollowUpInput;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateFollowUpInput;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
