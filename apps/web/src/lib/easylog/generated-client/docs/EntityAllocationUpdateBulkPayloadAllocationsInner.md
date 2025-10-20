
# EntityAllocationUpdateBulkPayloadAllocationsInner


## Properties

Name | Type
------------ | -------------
`id` | number
`start` | Date
`end` | Date
`type` | string
`comment` | string
`parentId` | number
`fields` | object

## Example

```typescript
import type { EntityAllocationUpdateBulkPayloadAllocationsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "start": null,
  "end": null,
  "type": null,
  "comment": null,
  "parentId": null,
  "fields": null,
} satisfies EntityAllocationUpdateBulkPayloadAllocationsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityAllocationUpdateBulkPayloadAllocationsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


