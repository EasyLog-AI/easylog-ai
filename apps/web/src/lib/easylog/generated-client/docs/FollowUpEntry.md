
# FollowUpEntry


## Properties

Name | Type
------------ | -------------
`id` | number
`followUpId` | number
`userId` | number
`versionId` | number
`data` | object
`followUp` | [FollowUpEntryFollowUp](FollowUpEntryFollowUp.md)
`user` | [FollowUpEntryUser](FollowUpEntryUser.md)
`createdAt` | Date
`updatedAt` | Date

## Example

```typescript
import type { FollowUpEntry } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "followUpId": null,
  "userId": null,
  "versionId": null,
  "data": null,
  "followUp": null,
  "user": null,
  "createdAt": null,
  "updatedAt": null,
} satisfies FollowUpEntry

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FollowUpEntry
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


