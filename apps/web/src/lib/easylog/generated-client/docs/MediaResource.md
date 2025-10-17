# MediaResource

## Properties

| Name        | Type                                                |
| ----------- | --------------------------------------------------- |
| `id`        | number                                              |
| `uuid`      | string                                              |
| `name`      | string                                              |
| `fileName`  | string                                              |
| `openLabel` | [MediaResourceOpenLabel](MediaResourceOpenLabel.md) |
| `mimeType`  | string                                              |
| `size`      | number                                              |
| `path`      | string                                              |
| `createdAt` | Date                                                |
| `updatedAt` | Date                                                |

## Example

```typescript
import type { MediaResource } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  uuid: null,
  name: null,
  fileName: null,
  openLabel: null,
  mimeType: null,
  size: null,
  path: null,
  createdAt: null,
  updatedAt: null
} satisfies MediaResource;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MediaResource;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
