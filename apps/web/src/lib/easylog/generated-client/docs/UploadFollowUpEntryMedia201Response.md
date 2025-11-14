# UploadFollowUpEntryMedia201Response

## Properties

| Name   | Type                              |
| ------ | --------------------------------- |
| `data` | [MediaResource](MediaResource.md) |
| `path` | string                            |

## Example

```typescript
import type { UploadFollowUpEntryMedia201Response } from ''

// TODO: Update the object below with actual values
const example = {
  "data": null,
  "path": 1/notices/1736854327-Screenshot.png--ORIG--U2NyZWVuc2hvdC5wbmc,
} satisfies UploadFollowUpEntryMedia201Response

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as UploadFollowUpEntryMedia201Response
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
