# FollowUpCategoriesApi

All URIs are relative to _/api_

| Method                                                                        | HTTP request                                 | Description                           |
| ----------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| [**listFollowUpCategories**](FollowUpCategoriesApi.md#listfollowupcategories) | **GET** /v2/follow-ups/categories            | List follow-up categories (paginated) |
| [**showFollowUpCategory**](FollowUpCategoriesApi.md#showfollowupcategory)     | **GET** /v2/follow-ups/categories/{category} | Show follow-up category               |

## listFollowUpCategories

> FollowUpCategoryCollection listFollowUpCategories(page, perPage)

List follow-up categories (paginated)

List all follow-up categories for the current client. Categories are filtered by user group membership unless the user has the FollowUpOverrideGroups permission. Users will only see categories that are either assigned to their groups or have no group assignment (ungrouped).

### Example

```ts
import { Configuration, FollowUpCategoriesApi } from '';
import type { ListFollowUpCategoriesRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpCategoriesApi(config);

  const body = {
    // number | Page number (optional)
    page: 56,
    // number | Number of items per page (1-100) (optional)
    perPage: 56
  } satisfies ListFollowUpCategoriesRequest;

  try {
    const data = await api.listFollowUpCategories(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name        | Type     | Description                      | Notes                         |
| ----------- | -------- | -------------------------------- | ----------------------------- |
| **page**    | `number` | Page number                      | [Optional] [Defaults to `1`]  |
| **perPage** | `number` | Number of items per page (1-100) | [Optional] [Defaults to `25`] |

### Return type

[**FollowUpCategoryCollection**](FollowUpCategoryCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                               | Response headers |
| ----------- | ----------------------------------------- | ---------------- |
| **200**     | Paginated follow-up categories collection | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## showFollowUpCategory

> FollowUpCategoryResource showFollowUpCategory(category)

Show follow-up category

Display the specified resource.

### Example

```ts
import { Configuration, FollowUpCategoriesApi } from '';
import type { ShowFollowUpCategoryRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpCategoriesApi(config);

  const body = {
    // number | Follow-up category ID
    category: 789
  } satisfies ShowFollowUpCategoryRequest;

  try {
    const data = await api.showFollowUpCategory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description           | Notes                     |
| ------------ | -------- | --------------------- | ------------------------- |
| **category** | `number` | Follow-up category ID | [Defaults to `undefined`] |

### Return type

[**FollowUpCategoryResource**](FollowUpCategoryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **200**     | Follow-up category | -                |
| **404**     | Category not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
