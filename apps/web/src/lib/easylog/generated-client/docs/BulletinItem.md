
# BulletinItem


## Properties

Name | Type
------------ | -------------
`id` | number
`title` | string
`content` | string
`type` | string
`bulletinChapterId` | number

## Example

```typescript
import type { BulletinItem } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "content": null,
  "type": null,
  "bulletinChapterId": null,
} satisfies BulletinItem

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BulletinItem
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


