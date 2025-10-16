
# PaginationLinks


## Properties

Name | Type
------------ | -------------
`first` | string
`last` | string
`prev` | string
`next` | string

## Example

```typescript
import type { PaginationLinks } from ''

// TODO: Update the object below with actual values
const example = {
  "first": https://example.com?page=1,
  "last": https://example.com?page=10,
  "prev": https://example.com?page=1,
  "next": https://example.com?page=3,
} satisfies PaginationLinks

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginationLinks
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


