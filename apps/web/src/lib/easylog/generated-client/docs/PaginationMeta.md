# PaginationMeta

## Properties

| Name          | Type                                             |
| ------------- | ------------------------------------------------ |
| `currentPage` | number                                           |
| `from`        | number                                           |
| `lastPage`    | number                                           |
| `links`       | [Array&lt;PaginationLink&gt;](PaginationLink.md) |
| `path`        | string                                           |
| `perPage`     | number                                           |
| `to`          | number                                           |
| `total`       | number                                           |

## Example

```typescript
import type { PaginationMeta } from ''

// TODO: Update the object below with actual values
const example = {
  "currentPage": 1,
  "from": 1,
  "lastPage": 5,
  "links": null,
  "path": https://example.com/resources,
  "perPage": 25,
  "to": 25,
  "total": 100,
} satisfies PaginationMeta

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PaginationMeta
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
