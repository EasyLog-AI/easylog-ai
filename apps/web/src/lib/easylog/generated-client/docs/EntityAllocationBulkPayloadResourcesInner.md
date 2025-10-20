
# EntityAllocationBulkPayloadResourcesInner


## Properties

Name | Type
------------ | -------------
`resourceId` | number
`type` | string
`comment` | string
`start` | Date
`end` | Date
`parentId` | number
`fields` | object

## Example

```typescript
import type { EntityAllocationBulkPayloadResourcesInner } from ''

// TODO: Update the object below with actual values
const example = {
  "resourceId": null,
  "type": null,
  "comment": null,
  "start": null,
  "end": null,
  "parentId": null,
  "fields": null,
} satisfies EntityAllocationBulkPayloadResourcesInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityAllocationBulkPayloadResourcesInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


