# Resource

## Properties

| Name        | Type                |
| ----------- | ------------------- |
| `id`        | number              |
| `label`     | string              |
| `name`      | string              |
| `slug`      | string              |
| `data`      | Array&lt;object&gt; |
| `createdAt` | Date                |
| `updatedAt` | Date                |

## Example

```typescript
import type { Resource } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  label: null,
  name: null,
  slug: null,
  data: null,
  createdAt: null,
  updatedAt: null
} satisfies Resource;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Resource;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
