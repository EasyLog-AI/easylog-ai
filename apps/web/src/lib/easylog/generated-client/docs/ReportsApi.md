# ReportsApi

All URIs are relative to _/api_

| Method                                                   | HTTP request                      | Description         |
| -------------------------------------------------------- | --------------------------------- | ------------------- |
| [**generatePdfReport**](ReportsApi.md#generatepdfreport) | **GET** /v2/{clientId}/pdf/{slug} | Generate PDF report |

## generatePdfReport

> Blob generatePdfReport(clientId, slug, data, as)

Generate PDF report

Generate and download a PDF report based on encrypted data parameters. Supports exporting single or multiple Eloquent models as PDF. Add ?as&#x3D;html to view HTML instead of PDF.

### Example

```ts
import { Configuration, ReportsApi } from '';
import type { GeneratePdfReportRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new ReportsApi(config);

  const body = {
    // number | Client ID
    clientId: 789,
    // string | PDF report configuration slug
    slug: slug_example,
    // string | Encrypted report data parameters
    data: data_example,
    // 'html' | Output format (html for preview, omit for PDF) (optional)
    as: as_example
  } satisfies GeneratePdfReportRequest;

  try {
    const data = await api.generatePdfReport(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                                    | Notes                                             |
| ------------ | -------- | ---------------------------------------------- | ------------------------------------------------- |
| **clientId** | `number` | Client ID                                      | [Defaults to `undefined`]                         |
| **slug**     | `string` | PDF report configuration slug                  | [Defaults to `undefined`]                         |
| **data**     | `string` | Encrypted report data parameters               | [Defaults to `undefined`]                         |
| **as**       | `html`   | Output format (html for preview, omit for PDF) | [Optional] [Defaults to `undefined`] [Enum: html] |

### Return type

**Blob**

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/pdf`

### HTTP response details

| Status code | Description                    | Response headers |
| ----------- | ------------------------------ | ---------------- |
| **200**     | PDF file or HTML preview       | -                |
| **400**     | Invalid data or unknown type   | -                |
| **401**     | Unauthorized                   | -                |
| **403**     | Unauthenticated                | -                |
| **404**     | Report configuration not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
