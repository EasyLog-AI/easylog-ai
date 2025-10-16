
# PrepareSubmission200ResponseFilesInner


## Properties

Name | Type
------------ | -------------
`token` | string
`originalName` | string
`method` | string
`uri` | string
`uploadableTill` | Date
`postableTill` | Date

## Example

```typescript
import type { PrepareSubmission200ResponseFilesInner } from ''

// TODO: Update the object below with actual values
const example = {
  "token": null,
  "originalName": null,
  "method": PUT,
  "uri": null,
  "uploadableTill": null,
  "postableTill": null,
} satisfies PrepareSubmission200ResponseFilesInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PrepareSubmission200ResponseFilesInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


