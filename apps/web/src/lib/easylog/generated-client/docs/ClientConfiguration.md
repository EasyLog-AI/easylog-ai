
# ClientConfiguration


## Properties

Name | Type
------------ | -------------
`defaultTimePeriod` | { [key: string]: any; }
`filters` | [Array&lt;ClientConfigurationFiltersInner&gt;](ClientConfigurationFiltersInner.md)
`can` | [ClientConfigurationCan](ClientConfigurationCan.md)
`planning` | { [key: string]: any; }

## Example

```typescript
import type { ClientConfiguration } from ''

// TODO: Update the object below with actual values
const example = {
  "defaultTimePeriod": null,
  "filters": null,
  "can": null,
  "planning": null,
} satisfies ClientConfiguration

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ClientConfiguration
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


