# FollowUpEntriesApi

All URIs are relative to _/api_

| Method                                                               | HTTP request                               | Description            |
| -------------------------------------------------------------------- | ------------------------------------------ | ---------------------- |
| [**createFollowUpEntry**](FollowUpEntriesApi.md#createfollowupentry) | **POST** /v2/follow-ups/{followUp}/entries | Create follow-up entry |
| [**deleteFollowUpEntry**](FollowUpEntriesApi.md#deletefollowupentry) | **DELETE** /v2/entries/{entry}             | Delete follow-up entry |
| [**listFollowUpEntries**](FollowUpEntriesApi.md#listfollowupentries) | **GET** /v2/follow-ups/{followUp}/entries  | List follow-up entries |
| [**showFollowUpEntry**](FollowUpEntriesApi.md#showfollowupentry)     | **GET** /v2/entries/{entry}                | Show follow-up entry   |
| [**updateFollowUpEntry**](FollowUpEntriesApi.md#updatefollowupentry) | **PATCH** /v2/entries/{entry}              | Update follow-up entry |

## createFollowUpEntry

> FollowUpEntryResource createFollowUpEntry(followUp, followUpEntryInput)

Create follow-up entry

Store a newly created resource in storage.

### Example

```ts
import {
  Configuration,
  FollowUpEntriesApi,
} from '';
import type { CreateFollowUpEntryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FollowUpEntriesApi(config);

  const body = {
    // number | Follow-up ID
    followUp: 789,
    // FollowUpEntryInput
    followUpEntryInput: ...,
  } satisfies CreateFollowUpEntryRequest;

  try {
    const data = await api.createFollowUpEntry(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description  | Notes                     |
| ---------------------- | ------------------------------------------- | ------------ | ------------------------- |
| **followUp**           | `number`                                    | Follow-up ID | [Defaults to `undefined`] |
| **followUpEntryInput** | [FollowUpEntryInput](FollowUpEntryInput.md) |              |                           |

### Return type

[**FollowUpEntryResource**](FollowUpEntryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description             | Response headers |
| ----------- | ----------------------- | ---------------- |
| **200**     | Created follow-up entry | -                |
| **404**     | Follow-up not found     | -                |
| **422**     | Validation error        | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## deleteFollowUpEntry

> deleteFollowUpEntry(entry)

Delete follow-up entry

Remove the specified resource from storage.

### Example

```ts
import { Configuration, FollowUpEntriesApi } from '';
import type { DeleteFollowUpEntryRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpEntriesApi(config);

  const body = {
    // number | Follow-up entry ID
    entry: 789
  } satisfies DeleteFollowUpEntryRequest;

  try {
    const data = await api.deleteFollowUpEntry(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description        | Notes                     |
| --------- | -------- | ------------------ | ------------------------- |
| **entry** | `number` | Follow-up entry ID | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description             | Response headers |
| ----------- | ----------------------- | ---------------- |
| **204**     | Follow-up entry deleted | -                |
| **404**     | Entry not found         | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## listFollowUpEntries

> FollowUpEntryCollection listFollowUpEntries(followUp)

List follow-up entries

Display a listing of the resource.

### Example

```ts
import { Configuration, FollowUpEntriesApi } from '';
import type { ListFollowUpEntriesRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpEntriesApi(config);

  const body = {
    // number | Follow-up ID
    followUp: 789
  } satisfies ListFollowUpEntriesRequest;

  try {
    const data = await api.listFollowUpEntries(body);
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

[**FollowUpEntryCollection**](FollowUpEntryCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description         | Response headers |
| ----------- | ------------------- | ---------------- |
| **200**     | Follow-up entries   | -                |
| **404**     | Follow-up not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## showFollowUpEntry

> FollowUpEntryResource showFollowUpEntry(entry)

Show follow-up entry

Display the specified resource.

### Example

```ts
import { Configuration, FollowUpEntriesApi } from '';
import type { ShowFollowUpEntryRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new FollowUpEntriesApi(config);

  const body = {
    // number | Follow-up entry ID
    entry: 789
  } satisfies ShowFollowUpEntryRequest;

  try {
    const data = await api.showFollowUpEntry(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description        | Notes                     |
| --------- | -------- | ------------------ | ------------------------- |
| **entry** | `number` | Follow-up entry ID | [Defaults to `undefined`] |

### Return type

[**FollowUpEntryResource**](FollowUpEntryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description     | Response headers |
| ----------- | --------------- | ---------------- |
| **200**     | Follow-up entry | -                |
| **404**     | Entry not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## updateFollowUpEntry

> FollowUpEntryResource updateFollowUpEntry(entry, followUpEntryInput)

Update follow-up entry

Update the specified resource in storage.

### Example

```ts
import {
  Configuration,
  FollowUpEntriesApi,
} from '';
import type { UpdateFollowUpEntryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FollowUpEntriesApi(config);

  const body = {
    // number | Follow-up entry ID
    entry: 789,
    // FollowUpEntryInput
    followUpEntryInput: ...,
  } satisfies UpdateFollowUpEntryRequest;

  try {
    const data = await api.updateFollowUpEntry(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description        | Notes                     |
| ---------------------- | ------------------------------------------- | ------------------ | ------------------------- |
| **entry**              | `number`                                    | Follow-up entry ID | [Defaults to `undefined`] |
| **followUpEntryInput** | [FollowUpEntryInput](FollowUpEntryInput.md) |                    |                           |

### Return type

[**FollowUpEntryResource**](FollowUpEntryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description             | Response headers |
| ----------- | ----------------------- | ---------------- |
| **200**     | Updated follow-up entry | -                |
| **404**     | Entry not found         | -                |
| **422**     | Validation error        | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
