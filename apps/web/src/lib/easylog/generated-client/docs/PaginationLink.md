
# PaginationLink


## Properties

Name | Type
------------ | -------------
`url` | string
`label` | string
`active` | boolean

## Example

```typescript
import type { PaginationLink } from ''

// TODO: Update the object below with actual values
const example = {
  "url": https://example.com?page=2,
  "label": Next,
  "active": false,
} satisfies PaginationLink

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginationLink
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


