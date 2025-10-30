# MediaDetailResource

Detailed media resource with presigned S3 URLs

## Properties

| Name          | Type                                                                |
| ------------- | ------------------------------------------------------------------- |
| `id`          | number                                                              |
| `uuid`        | string                                                              |
| `name`        | string                                                              |
| `fileName`    | string                                                              |
| `mimeType`    | string                                                              |
| `size`        | number                                                              |
| `url`         | string                                                              |
| `conversions` | [MediaDetailResourceConversions](MediaDetailResourceConversions.md) |
| `dimensions`  | [MediaDetailResourceDimensions](MediaDetailResourceDimensions.md)   |
| `expiresAt`   | Date                                                                |
| `createdAt`   | Date                                                                |
| `updatedAt`   | Date                                                                |

## Example

```typescript
import type { MediaDetailResource } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  uuid: null,
  name: null,
  fileName: null,
  mimeType: image / jpeg,
  size: null,
  url: null,
  conversions: null,
  dimensions: null,
  expiresAt: null,
  createdAt: null,
  updatedAt: null
} satisfies MediaDetailResource;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MediaDetailResource;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
