# AnnouncementStatus

## Properties

| Name        | Type   |
| ----------- | ------ |
| `id`        | number |
| `status`    | string |
| `mediaId`   | number |
| `createdAt` | Date   |
| `updatedAt` | Date   |

## Example

```typescript
import type { AnnouncementStatus } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  status: null,
  mediaId: null,
  createdAt: null,
  updatedAt: null
} satisfies AnnouncementStatus;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AnnouncementStatus;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
