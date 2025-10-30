# CategoryCollection

Paginated collection of categories

## Properties

| Name    | Type                                                  |
| ------- | ----------------------------------------------------- |
| `data`  | [Array&lt;Category&gt;](Category.md)                  |
| `links` | [CategoryCollectionLinks](CategoryCollectionLinks.md) |
| `meta`  | [CategoryCollectionMeta](CategoryCollectionMeta.md)   |

## Example

```typescript
import type { CategoryCollection } from '';

// TODO: Update the object below with actual values
const example = {
  data: null,
  links: null,
  meta: null
} satisfies CategoryCollection;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CategoryCollection;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
