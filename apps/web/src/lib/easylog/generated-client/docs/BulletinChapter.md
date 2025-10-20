
# BulletinChapter


## Properties

Name | Type
------------ | -------------
`id` | number
`title` | string
`items` | [Array&lt;BulletinItem&gt;](BulletinItem.md)
`chapters` | [Array&lt;BulletinChapter&gt;](BulletinChapter.md)

## Example

```typescript
import type { BulletinChapter } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": null,
  "items": null,
  "chapters": null,
} satisfies BulletinChapter

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BulletinChapter
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


