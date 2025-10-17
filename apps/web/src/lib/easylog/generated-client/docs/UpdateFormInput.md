# UpdateFormInput

## Properties

| Name                  | Type    |
| --------------------- | ------- |
| `name`                | string  |
| `description`         | string  |
| `avatar`              | string  |
| `content`             | string  |
| `forceSchemaValidity` | boolean |

## Example

```typescript
import type { UpdateFormInput } from '';

// TODO: Update the object below with actual values
const example = {
  name: null,
  description: null,
  avatar: null,
  content: null,
  forceSchemaValidity: null
} satisfies UpdateFormInput;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UpdateFormInput;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
