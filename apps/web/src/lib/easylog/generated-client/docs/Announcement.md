# Announcement

## Properties

| Name          | Type                                                     |
| ------------- | -------------------------------------------------------- |
| `id`          | number                                                   |
| `category`    | [AnnouncementCategory](AnnouncementCategory.md)          |
| `title`       | string                                                   |
| `content`     | string                                                   |
| `readReceipt` | boolean                                                  |
| `sender`      | [AnnouncementSender](AnnouncementSender.md)              |
| `attachments` | [Array&lt;MediaResource&gt;](MediaResource.md)           |
| `statuses`    | [Array&lt;AnnouncementStatus&gt;](AnnouncementStatus.md) |
| `createdAt`   | Date                                                     |
| `updatedAt`   | Date                                                     |

## Example

```typescript
import type { Announcement } from '';

// TODO: Update the object below with actual values
const example = {
  id: null,
  category: null,
  title: null,
  content: null,
  readReceipt: null,
  sender: null,
  attachments: null,
  statuses: null,
  createdAt: null,
  updatedAt: null
} satisfies Announcement;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Announcement;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
