
# PersistSubmissionRequest


## Properties

Name | Type
------------ | -------------
`data` | { [key: string]: any; }
`formVersionId` | number
`checksum` | string

## Example

```typescript
import type { PersistSubmissionRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "data": null,
  "formVersionId": null,
  "checksum": null,
} satisfies PersistSubmissionRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PersistSubmissionRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


