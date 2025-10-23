# MediaDetailResourceConversions

Available image conversions with presigned URLs

## Properties

| Name              | Type   |
| ----------------- | ------ |
| `preview`         | string |
| `detail`          | string |
| `maxHeight300px`  | string |
| `maxHeight380px`  | string |
| `maxHeight850px`  | string |
| `maxHeight1000px` | string |

## Example

```typescript
import type { MediaDetailResourceConversions } from '';

// TODO: Update the object below with actual values
const example = {
  preview: null,
  detail: null,
  maxHeight300px: null,
  maxHeight380px: null,
  maxHeight850px: null,
  maxHeight1000px: null
} satisfies MediaDetailResourceConversions;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MediaDetailResourceConversions;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
