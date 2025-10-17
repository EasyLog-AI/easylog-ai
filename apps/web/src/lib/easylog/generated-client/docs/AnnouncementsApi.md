# AnnouncementsApi

All URIs are relative to _/api_

| Method                                                                       | HTTP request                                     | Description                |
| ---------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------- |
| [**listAnnouncements**](AnnouncementsApi.md#listannouncements)               | **GET** /v2/announcements                        | List announcements         |
| [**showAnnouncement**](AnnouncementsApi.md#showannouncement)                 | **GET** /v2/announcements/{announcement}         | Show announcement          |
| [**updateAnnouncementStatus**](AnnouncementsApi.md#updateannouncementstatus) | **POST** /v2/announcements/{announcement}/status | Update announcement status |

## listAnnouncements

> AnnouncementCollection listAnnouncements()

List announcements

List all announcements for the authenticated user. Automatically marks unread announcements as retrieved.

### Example

```ts
import { Configuration, AnnouncementsApi } from '';
import type { ListAnnouncementsRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new AnnouncementsApi(config);

  try {
    const data = await api.listAnnouncements();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**AnnouncementCollection**](AnnouncementCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description              | Response headers |
| ----------- | ------------------------ | ---------------- |
| **200**     | Announcements collection | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## showAnnouncement

> AnnouncementResource showAnnouncement(announcement)

Show announcement

Display a specific announcement. Automatically marks the announcement as retrieved if not already marked.

### Example

```ts
import { Configuration, AnnouncementsApi } from '';
import type { ShowAnnouncementRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new AnnouncementsApi(config);

  const body = {
    // number | Announcement ID
    announcement: 789
  } satisfies ShowAnnouncementRequest;

  try {
    const data = await api.showAnnouncement(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name             | Type     | Description     | Notes                     |
| ---------------- | -------- | --------------- | ------------------------- |
| **announcement** | `number` | Announcement ID | [Defaults to `undefined`] |

### Return type

[**AnnouncementResource**](AnnouncementResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                          | Response headers |
| ----------- | ---------------------------------------------------- | ---------------- |
| **200**     | Announcement                                         | -                |
| **403**     | Forbidden - not authorized to view this announcement | -                |
| **404**     | Announcement not found                               | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## updateAnnouncementStatus

> AnnouncementResource updateAnnouncementStatus(announcement, announcementStatusInput)

Update announcement status

Track user interaction with an announcement by recording status updates (retrieved, opened, scrolled_down, opened_attachment, confirmed_messages_read).

### Example

```ts
import {
  Configuration,
  AnnouncementsApi,
} from '';
import type { UpdateAnnouncementStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new AnnouncementsApi(config);

  const body = {
    // number | Announcement ID
    announcement: 789,
    // AnnouncementStatusInput
    announcementStatusInput: ...,
  } satisfies UpdateAnnouncementStatusRequest;

  try {
    const data = await api.updateAnnouncementStatus(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                        | Type                                                  | Description     | Notes                     |
| --------------------------- | ----------------------------------------------------- | --------------- | ------------------------- |
| **announcement**            | `number`                                              | Announcement ID | [Defaults to `undefined`] |
| **announcementStatusInput** | [AnnouncementStatusInput](AnnouncementStatusInput.md) |                 |                           |

### Return type

[**AnnouncementResource**](AnnouncementResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                    | Response headers |
| ----------- | ---------------------------------------------- | ---------------- |
| **200**     | Announcement with updated status               | -                |
| **403**     | Forbidden - not authorized or invalid media_id | -                |
| **404**     | Announcement not found                         | -                |
| **422**     | Validation error                               | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
