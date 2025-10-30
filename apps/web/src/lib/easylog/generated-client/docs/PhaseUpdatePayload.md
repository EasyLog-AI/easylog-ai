# PhaseUpdatePayload

## Properties

| Name       | Type    |
| ---------- | ------- |
| `start`    | Date    |
| `end`      | Date    |
| `isStaged` | boolean |

## Example

```typescript
import type { PhaseUpdatePayload } from '';

// TODO: Update the object below with actual values
const example = {
  start: null,
  end: null,
  isStaged: null
} satisfies PhaseUpdatePayload;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PhaseUpdatePayload;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
