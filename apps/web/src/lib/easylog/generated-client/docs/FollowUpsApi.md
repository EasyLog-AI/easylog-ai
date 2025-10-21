# FollowUpsApi

All URIs are relative to _/api_

| Method                                               | HTTP request                         | Description                 |
| ---------------------------------------------------- | ------------------------------------ | --------------------------- |
| [**createFollowUp**](FollowUpsApi.md#createfollowup) | **POST** /v2/follow-ups              | Create follow-up            |
| [**deleteFollowUp**](FollowUpsApi.md#deletefollowup) | **DELETE** /v2/follow-ups/{followUp} | Delete follow-up            |
| [**listFollowUps**](FollowUpsApi.md#listfollowups)   | **GET** /v2/follow-ups               | List follow-ups (paginated) |
| [**showFollowUp**](FollowUpsApi.md#showfollowup)     | **GET** /v2/follow-ups/{followUp}    | Show follow-up              |
| [**updateFollowUp**](FollowUpsApi.md#updatefollowup) | **PATCH** /v2/follow-ups/{followUp}  | Update follow-up            |

## createFollowUp

> FollowUpResource createFollowUp(storeFollowUpInput)

Create follow-up

Store a newly created resource in storage.

### Example

```ts
import {
  Configuration,
  FollowUpsApi,
} from '';
import type { CreateFollowUpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FollowUpsApi(config);

  const body = {
    // StoreFollowUpInput
    storeFollowUpInput: ...,
  } satisfies CreateFollowUpRequest;

  try {
    const data = await api.createFollowUp(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description | Notes |
| ---------------------- | ------------------------------------------- | ----------- | ----- |
| **storeFollowUpInput** | [StoreFollowUpInput](StoreFollowUpInput.md) |             |       |

### Return type

[**FollowUpResource**](FollowUpResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description       | Response headers |
| ----------- | ----------------- | ---------------- |
| **200**     | Created follow-up | -                |
| **422**     | Validation error  | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## deleteFollowUp

> deleteFollowUp(followUp)

Delete follow-up

Remove the specified resource from storage.

### Example

```ts
import { Configuration, FollowUpsApi } from '';
import type { DeleteFollowUpRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpsApi(config);

  const body = {
    // number | Follow-up ID
    followUp: 789
  } satisfies DeleteFollowUpRequest;

  try {
    const data = await api.deleteFollowUp(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description  | Notes                     |
| ------------ | -------- | ------------ | ------------------------- |
| **followUp** | `number` | Follow-up ID | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description         | Response headers |
| ----------- | ------------------- | ---------------- |
| **204**     | Follow-up deleted   | -                |
| **404**     | Follow-up not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## listFollowUps

> FollowUpCollection listFollowUps(page, perPage)

List follow-ups (paginated)

List all follow-ups for the current client. Follow-ups are filtered by user group membership unless the user has the FollowUpOverrideGroups permission. Users will only see follow-ups that are either assigned to their groups or have no group assignment (ungrouped).

### Example

```ts
import { Configuration, FollowUpsApi } from '';
import type { ListFollowUpsRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpsApi(config);

  const body = {
    // number | Page number (optional)
    page: 56,
    // number | Number of items per page (1-100) (optional)
    perPage: 56
  } satisfies ListFollowUpsRequest;

  try {
    const data = await api.listFollowUps(body);
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

[**FollowUpCollection**](FollowUpCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                     | Response headers |
| ----------- | ------------------------------- | ---------------- |
| **200**     | Paginated follow-ups collection | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## showFollowUp

> FollowUpResource showFollowUp(followUp)

Show follow-up

Display the specified resource.

### Example

```ts
import { Configuration, FollowUpsApi } from '';
import type { ShowFollowUpRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpsApi(config);

  const body = {
    // number | Follow-up ID
    followUp: 789
  } satisfies ShowFollowUpRequest;

  try {
    const data = await api.showFollowUp(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description  | Notes                     |
| ------------ | -------- | ------------ | ------------------------- |
| **followUp** | `number` | Follow-up ID | [Defaults to `undefined`] |

### Return type

[**FollowUpResource**](FollowUpResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description         | Response headers |
| ----------- | ------------------- | ---------------- |
| **200**     | Follow-up           | -                |
| **404**     | Follow-up not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## updateFollowUp

> FollowUpResource updateFollowUp(followUp, updateFollowUpInput)

Update follow-up

Update the specified resource in storage.

### Example

```ts
import {
  Configuration,
  FollowUpsApi,
} from '';
import type { UpdateFollowUpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FollowUpsApi(config);

  const body = {
    // number | Follow-up ID
    followUp: 789,
    // UpdateFollowUpInput
    updateFollowUpInput: ...,
  } satisfies UpdateFollowUpRequest;

  try {
    const data = await api.updateFollowUp(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description  | Notes                     |
| ----------------------- | --------------------------------------------- | ------------ | ------------------------- |
| **followUp**            | `number`                                      | Follow-up ID | [Defaults to `undefined`] |
| **updateFollowUpInput** | [UpdateFollowUpInput](UpdateFollowUpInput.md) |              |                           |

### Return type

[**FollowUpResource**](FollowUpResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description         | Response headers |
| ----------- | ------------------- | ---------------- |
| **200**     | Updated follow-up   | -                |
| **404**     | Follow-up not found | -                |
| **422**     | Validation error    | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
