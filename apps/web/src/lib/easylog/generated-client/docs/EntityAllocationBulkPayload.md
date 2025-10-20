
# EntityAllocationBulkPayload


## Properties

Name | Type
------------ | -------------
`projectId` | number
`group` | string
`resources` | [Array&lt;EntityAllocationBulkPayloadResourcesInner&gt;](EntityAllocationBulkPayloadResourcesInner.md)

## Example

```typescript
import type { EntityAllocationBulkPayload } from ''

// TODO: Update the object below with actual values
const example = {
  "projectId": null,
  "group": null,
  "resources": null,
} satisfies EntityAllocationBulkPayload

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityAllocationBulkPayload
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


