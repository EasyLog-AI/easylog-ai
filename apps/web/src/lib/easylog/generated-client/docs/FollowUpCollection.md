# FollowUpCollection

Paginated collection of follow-ups

## Properties

| Name    | Type                                                  |
| ------- | ----------------------------------------------------- |
| `data`  | [Array&lt;FollowUp&gt;](FollowUp.md)                  |
| `links` | [CategoryCollectionLinks](CategoryCollectionLinks.md) |
| `meta`  | [CategoryCollectionMeta](CategoryCollectionMeta.md)   |

## Example

```typescript
import type { FollowUpCollection } from '';

// TODO: Update the object below with actual values
const example = {
  data: null,
  links: null,
  meta: null
} satisfies FollowUpCollection;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FollowUpCollection;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
