# AllocationsApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**_0863fb1e5c361fd6eaaf8f6ddc95d99e**](AllocationsApi.md#_0863fb1e5c361fd6eaaf8f6ddc95d99e) | **POST** /v2/datasources/allocations/multiple | Create multiple allocations |
| [**_4057f6a7ca356a8dfedfffa3d0d92f46**](AllocationsApi.md#_4057f6a7ca356a8dfedfffa3d0d92f46) | **POST** /v2/datasources/allocations | Create allocation (deprecated) |
| [**_48b533fbc9852c80d9329e7068cd9437**](AllocationsApi.md#_48b533fbc9852c80d9329e7068cd9437) | **DELETE** /v2/datasources/allocations/{allocation} | Delete allocation |
| [**_5eb8813b275e790b00fa7c1b647ece45**](AllocationsApi.md#_5eb8813b275e790b00fa7c1b647ece45) | **PUT** /v2/datasources/allocations/multiple | Update multiple allocations |
| [**_807f23f9ac132c6dbe9f0933971ba71a**](AllocationsApi.md#_807f23f9ac132c6dbe9f0933971ba71a) | **PATCH** /v2/datasources/allocations/{allocation} | Update allocation (deprecated) |
| [**_80f35f8b217b7cd8bf36ad223d6cbdc3**](AllocationsApi.md#_80f35f8b217b7cd8bf36ad223d6cbdc3) | **GET** /v2/datasources/allocations/{allocation} | Show allocation |
| [**c9ff5e98685c16a4f47a5a83ce1c8ff6**](AllocationsApi.md#c9ff5e98685c16a4f47a5a83ce1c8ff6) | **GET** /v2/datasources/allocations/multiple | Show multiple allocations |



## _0863fb1e5c361fd6eaaf8f6ddc95d99e

> EntityAllocationCollection _0863fb1e5c361fd6eaaf8f6ddc95d99e(entityAllocationBulkPayload)

Create multiple allocations

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { 0863fb1e5c361fd6eaaf8f6ddc95d99eRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // EntityAllocationBulkPayload
    entityAllocationBulkPayload: ...,
  } satisfies 0863fb1e5c361fd6eaaf8f6ddc95d99eRequest;

  try {
    const data = await api._0863fb1e5c361fd6eaaf8f6ddc95d99e(body);
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


## _4057f6a7ca356a8dfedfffa3d0d92f46

> EntityAllocation _4057f6a7ca356a8dfedfffa3d0d92f46(entityAllocationPayload)

Create allocation (deprecated)

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { 4057f6a7ca356a8dfedfffa3d0d92f46Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // EntityAllocationPayload
    entityAllocationPayload: ...,
  } satisfies 4057f6a7ca356a8dfedfffa3d0d92f46Request;

  try {
    const data = await api._4057f6a7ca356a8dfedfffa3d0d92f46(body);
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


## _48b533fbc9852c80d9329e7068cd9437

> _48b533fbc9852c80d9329e7068cd9437(allocation)

Delete allocation

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { 48b533fbc9852c80d9329e7068cd9437Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // number
    allocation: 789,
  } satisfies 48b533fbc9852c80d9329e7068cd9437Request;

  try {
    const data = await api._48b533fbc9852c80d9329e7068cd9437(body);
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


## _5eb8813b275e790b00fa7c1b647ece45

> EntityAllocationCollection _5eb8813b275e790b00fa7c1b647ece45(entityAllocationBulkPayload)

Update multiple allocations

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { 5eb8813b275e790b00fa7c1b647ece45Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // EntityAllocationBulkPayload
    entityAllocationBulkPayload: ...,
  } satisfies 5eb8813b275e790b00fa7c1b647ece45Request;

  try {
    const data = await api._5eb8813b275e790b00fa7c1b647ece45(body);
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
| **201** | Allocations updated |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## _807f23f9ac132c6dbe9f0933971ba71a

> EntityAllocation _807f23f9ac132c6dbe9f0933971ba71a(allocation, entityAllocationPayload)

Update allocation (deprecated)

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { 807f23f9ac132c6dbe9f0933971ba71aRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // number
    allocation: 789,
    // EntityAllocationPayload
    entityAllocationPayload: ...,
  } satisfies 807f23f9ac132c6dbe9f0933971ba71aRequest;

  try {
    const data = await api._807f23f9ac132c6dbe9f0933971ba71a(body);
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


## _80f35f8b217b7cd8bf36ad223d6cbdc3

> EntityAllocation _80f35f8b217b7cd8bf36ad223d6cbdc3(allocation)

Show allocation

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { 80f35f8b217b7cd8bf36ad223d6cbdc3Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // number
    allocation: 789,
  } satisfies 80f35f8b217b7cd8bf36ad223d6cbdc3Request;

  try {
    const data = await api._80f35f8b217b7cd8bf36ad223d6cbdc3(body);
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


## c9ff5e98685c16a4f47a5a83ce1c8ff6

> EntityAllocationCollection c9ff5e98685c16a4f47a5a83ce1c8ff6(ids)

Show multiple allocations

### Example

```ts
import {
  Configuration,
  AllocationsApi,
} from '';
import type { C9ff5e98685c16a4f47a5a83ce1c8ff6Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AllocationsApi();

  const body = {
    // string | Comma separated allocation identifiers (optional)
    ids: 1,2,3,
  } satisfies C9ff5e98685c16a4f47a5a83ce1c8ff6Request;

  try {
    const data = await api.c9ff5e98685c16a4f47a5a83ce1c8ff6(body);
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

