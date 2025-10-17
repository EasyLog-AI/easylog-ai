# CalendarApi

All URIs are relative to _/api_

| Method                                                    | HTTP request                     | Description                     |
| --------------------------------------------------------- | -------------------------------- | ------------------------------- |
| [**exportCalendarICS**](CalendarApi.md#exportcalendarics) | **GET** /v2/calendar/{token}/ics | Export resource calendar as ICS |

## exportCalendarICS

> Blob exportCalendarICS(token)

Export resource calendar as ICS

Export allocations for a resource as an iCalendar (.ics) file using a secure token. Returns text/calendar format.

### Example

```ts
import { Configuration, CalendarApi } from '';
import type { ExportCalendarICSRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const api = new CalendarApi();

  const body = {
    // string | Secure calendar token
    token: token_example
  } satisfies ExportCalendarICSRequest;

  try {
    const data = await api.exportCalendarICS(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description           | Notes                     |
| --------- | -------- | --------------------- | ------------------------- |
| **token** | `string` | Secure calendar token | [Defaults to `undefined`] |

### Return type

**Blob**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `text/calendar`

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **200**     | ICS calendar file  | -                |
| **404**     | Calendar not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
