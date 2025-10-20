
# EntityAllocationPayload


## Properties

Name | Type
------------ | -------------
`projectId` | number
`resourceId` | number
`group` | string
`type` | string
`comment` | string
`start` | Date
`end` | Date
`fields` | object

## Example

```typescript
import type { EntityAllocationPayload } from ''

// TODO: Update the object below with actual values
const example = {
  "projectId": null,
  "resourceId": null,
  "group": null,
  "type": null,
  "comment": null,
  "start": null,
  "end": null,
  "fields": null,
} satisfies EntityAllocationPayload

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityAllocationPayload
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


