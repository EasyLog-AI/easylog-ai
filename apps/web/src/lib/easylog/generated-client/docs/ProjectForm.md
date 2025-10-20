# ProjectForm

## Properties

| Name                    | Type    |
| ----------------------- | ------- |
| `id`                    | number  |
| `projectId`             | number  |
| `formId`                | number  |
| `categoryId`            | number  |
| `fromDate`              | Date    |
| `toDate`                | Date    |
| `emailToSubmitter`      | boolean |
| `emailPrimary`          | string  |
| `emailSecondary`        | string  |
| `rrule`                 | string  |
| `order`                 | number  |
| `resetAtMidnight`       | boolean |
| `showOldSubmission`     | boolean |
| `resetStatusAtMidnight` | boolean |

## Example

```typescript
import type { ProjectForm } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  projectId: null,
  formId: null,
  categoryId: null,
  fromDate: null,
  toDate: null,
  emailToSubmitter: null,
  emailPrimary: null,
  emailSecondary: null,
  rrule: null,
  order: null,
  resetAtMidnight: null,
  showOldSubmission: null,
  resetStatusAtMidnight: null
} satisfies ProjectForm;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ProjectForm;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
