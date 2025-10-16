# EntityAllocationUpdateBulkPayload

## Properties

| Name          | Type                                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `allocations` | [Array&lt;EntityAllocationUpdateBulkPayloadAllocationsInner&gt;](EntityAllocationUpdateBulkPayloadAllocationsInner.md) |

## Example

```typescript
import type { EntityAllocationUpdateBulkPayload } from '';

// TODO: Update the object below with actual values
const example = {
  allocations: null
} satisfies EntityAllocationUpdateBulkPayload;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(
  exampleJSON
) as EntityAllocationUpdateBulkPayload;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
