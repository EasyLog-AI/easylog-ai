# ProjectPayload

Project creation/update payload

## Properties

| Name                | Type    |
| ------------------- | ------- |
| `name`              | string  |
| `color`             | string  |
| `reportVisible`     | boolean |
| `excludeInWorkdays` | boolean |
| `start`             | Date    |
| `end`               | Date    |
| `extraData`         | object  |

## Example

```typescript
import type { ProjectPayload } from '';

// TODO: Update the object below with actual values
const example = {
  name: null,
  color: null,
  reportVisible: null,
  excludeInWorkdays: null,
  start: null,
  end: null,
  extraData: null
} satisfies ProjectPayload;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProjectPayload;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
