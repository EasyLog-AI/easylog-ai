
# Form


## Properties

Name | Type
------------ | -------------
`id` | number
`name` | string
`description` | string
`avatar` | string
`clientId` | number
`content` | string
`hasActions` | boolean
`createdAt` | Date
`updatedAt` | Date
`accessedAt` | Date

## Example

```typescript
import type { Form } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "description": null,
  "avatar": null,
  "clientId": null,
  "content": null,
  "hasActions": null,
  "createdAt": null,
  "updatedAt": null,
  "accessedAt": null,
} satisfies Form

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Form
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


