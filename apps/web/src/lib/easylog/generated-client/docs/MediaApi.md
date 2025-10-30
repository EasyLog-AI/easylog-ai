# MediaApi

All URIs are relative to _/api_

| Method                                 | HTTP request              | Description     |
| -------------------------------------- | ------------------------- | --------------- |
| [**showMedia**](MediaApi.md#showmedia) | **GET** /v2/media/{media} | Show media file |

## showMedia

> ShowMedia200Response showMedia(media, conversion)

Show media file

Get media file details including presigned download URL (valid for 1 hour) and available image conversions. Supports both numeric ID and UUID.

### Example

```ts
import {
  Configuration,
  MediaApi,
} from '';
import type { ShowMediaRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new MediaApi(config);

  const body = {
    // string | Media ID (numeric) or UUID
    media: 789 or 550e8400-e29b-41d4-a716-446655440000,
    // string | Request specific image conversion (preview, detail, max-height-300px, max-height-380px, max-height-850px, max-height-1000px) (optional)
    conversion: detail,
  } satisfies ShowMediaRequest;

  try {
    const data = await api.showMedia(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description                                                                                                                  | Notes                                |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **media**      | `string` | Media ID (numeric) or UUID                                                                                                   | [Defaults to `undefined`]            |
| **conversion** | `string` | Request specific image conversion (preview, detail, max-height-300px, max-height-380px, max-height-850px, max-height-1000px) | [Optional] [Defaults to `undefined`] |

### Return type

[**ShowMedia200Response**](ShowMedia200Response.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                   | Response headers |
| ----------- | --------------------------------------------- | ---------------- |
| **200**     | Media details with presigned download URLs    | -                |
| **403**     | Forbidden - not authorized to view this media | -                |
| **404**     | Media not found or has no associated model    | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
