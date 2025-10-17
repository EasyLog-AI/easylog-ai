# EntityCollection

## Properties

| Name    | Type                                  |
| ------- | ------------------------------------- |
| `links` | [PaginationLinks](PaginationLinks.md) |
| `meta`  | [PaginationMeta](PaginationMeta.md)   |
| `data`  | [Array&lt;Entity&gt;](Entity.md)      |

## Example

```typescript
import type { EntityCollection } from '';

// TODO: Update the object below with actual values
const example = {
  links: null,
  meta: null,
  data: null
} satisfies EntityCollection;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityCollection;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
