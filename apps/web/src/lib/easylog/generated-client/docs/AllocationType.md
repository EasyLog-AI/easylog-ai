
# AllocationType


## Properties

Name | Type
------------ | -------------
`id` | number
`name` | string
`label` | string
`slug` | string
`start` | Date
`end` | Date
`isStaged` | boolean

## Example

```typescript
import type { AllocationType } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "label": null,
  "slug": null,
  "start": null,
  "end": null,
  "isStaged": null,
} satisfies AllocationType

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AllocationType
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


