# AllocationsApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createAllocation**](AllocationsApi.md#createallocation) | **POST** /v2/datasources/allocations | Create allocation (deprecated) |
| [**createMultipleAllocations**](AllocationsApi.md#createmultipleallocations) | **POST** /v2/datasources/allocations/multiple | Create multiple allocations |
| [**deleteAllocation**](AllocationsApi.md#deleteallocation) | **DELETE** /v2/datasources/allocations/{allocation} | Delete allocation |
| [**showAllocation**](AllocationsApi.md#showallocation) | **GET** /v2/datasources/allocations/{allocation} | Show allocation |
| [**showMultipleAllocations**](AllocationsApi.md#showmultipleallocations) | **GET** /v2/datasources/allocations/multiple | Show multiple allocations |
| [**updateAllocation**](AllocationsApi.md#updateallocation) | **PATCH** /v2/datasources/allocations/{allocation} | Update allocation (deprecated) |
| [**updateMultipleAllocations**](AllocationsApi.md#updatemultipleallocations) | **PUT** /v2/datasources/allocations/multiple | Update multiple allocations |



## createAllocation

> EntityAllocation createAllocation(entityAllocationPayload)

Create allocation (deprecated)

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { CreateAllocationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // EntityAllocationPayload
    entityAllocationPayload: ...,
  } satisfies CreateAllocationRequest;

  try {
    const data = await api.createAllocation(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **entityAllocationPayload** | [EntityAllocationPayload](EntityAllocationPayload.md) |  | |

### Return type

[**EntityAllocation**](EntityAllocation.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Allocation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## createMultipleAllocations

> EntityAllocationCollection createMultipleAllocations(entityAllocationBulkPayload)

Create multiple allocations

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { CreateMultipleAllocationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // EntityAllocationBulkPayload
    entityAllocationBulkPayload: ...,
  } satisfies CreateMultipleAllocationsRequest;

  try {
    const data = await api.createMultipleAllocations(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **entityAllocationBulkPayload** | [EntityAllocationBulkPayload](EntityAllocationBulkPayload.md) |  | |

### Return type

[**EntityAllocationCollection**](EntityAllocationCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Allocations created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteAllocation

> deleteAllocation(allocation)

Delete allocation

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { DeleteAllocationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // number
    allocation: 789,
  } satisfies DeleteAllocationRequest;

  try {
    const data = await api.deleteAllocation(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **allocation** | `number` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Allocation deleted |  -  |
| **500** | Could not delete allocation. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showAllocation

> EntityAllocation showAllocation(allocation)

Show allocation

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { ShowAllocationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // number
    allocation: 789,
  } satisfies ShowAllocationRequest;

  try {
    const data = await api.showAllocation(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **allocation** | `number` |  | [Defaults to `undefined`] |

### Return type

[**EntityAllocation**](EntityAllocation.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Allocation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showMultipleAllocations

> EntityAllocationCollection showMultipleAllocations(ids)

Show multiple allocations

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { ShowMultipleAllocationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // string | Comma separated allocation identifiers (optional)
    ids: 1,2,3,
  } satisfies ShowMultipleAllocationsRequest;

  try {
    const data = await api.showMultipleAllocations(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **ids** | `string` | Comma separated allocation identifiers | [Optional] [Defaults to `undefined`] |

### Return type

[**EntityAllocationCollection**](EntityAllocationCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Allocations |  -  |
| **422** | IDs missing or invalid |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateAllocation

> EntityAllocation updateAllocation(allocation, entityAllocationPayload)

Update allocation (deprecated)

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { UpdateAllocationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // number
    allocation: 789,
    // EntityAllocationPayload
    entityAllocationPayload: ...,
  } satisfies UpdateAllocationRequest;

  try {
    const data = await api.updateAllocation(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **allocation** | `number` |  | [Defaults to `undefined`] |
| **entityAllocationPayload** | [EntityAllocationPayload](EntityAllocationPayload.md) |  | |

### Return type

[**EntityAllocation**](EntityAllocation.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Allocation |  -  |
| **500** | Could not update allocation. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateMultipleAllocations

> EntityAllocationCollection updateMultipleAllocations(entityAllocationUpdateBulkPayload)

Update multiple allocations

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { UpdateMultipleAllocationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // EntityAllocationUpdateBulkPayload
    entityAllocationUpdateBulkPayload: ...,
  } satisfies UpdateMultipleAllocationsRequest;

  try {
    const data = await api.updateMultipleAllocations(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **entityAllocationUpdateBulkPayload** | [EntityAllocationUpdateBulkPayload](EntityAllocationUpdateBulkPayload.md) |  | |

### Return type

[**EntityAllocationCollection**](EntityAllocationCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Allocations updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

