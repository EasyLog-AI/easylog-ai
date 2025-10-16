# BulletinApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**listBulletinItems**](BulletinApi.md#listbulletinitems) | **GET** /v2/bulletin-items | List bulletin chapters and items |



## listBulletinItems

> BulletinChapterCollection listBulletinItems()

List bulletin chapters and items

Get all bulletin chapters with their items, organized hierarchically. Includes items not assigned to any chapter as a synthetic first chapter with id&#x3D;0. Only returns chapters and items accessible to the user\&#39;s groups.

### Example

```ts
import {
  Configuration,
  BulletinApi,
} from '';
import type { ListBulletinItemsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new BulletinApi(config);

  try {
    const data = await api.listBulletinItems();
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

[**BulletinChapterCollection**](BulletinChapterCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Bulletin chapters and items |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

