# PlanningPhasesApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**_0311da1cea655bc2d1604d7d41b7bfd9**](PlanningPhasesApi.md#_0311da1cea655bc2d1604d7d41b7bfd9) | **DELETE** /v2/datasources/phases/{phase} | Delete phase |
| [**_0d3e5e87594938822a3f4342dad62f36**](PlanningPhasesApi.md#_0d3e5e87594938822a3f4342dad62f36) | **GET** /v2/datasources/phases/{phase} | Show phase |
| [**_83ce4b16b2af73d27a64fb48ae1fc62f**](PlanningPhasesApi.md#_83ce4b16b2af73d27a64fb48ae1fc62f) | **GET** /v2/datasources/project/{project}/phases | List project phases |
| [**ad1d21e7985e497ed7c5ff220ac5ead2**](PlanningPhasesApi.md#ad1d21e7985e497ed7c5ff220ac5ead2) | **PATCH** /v2/datasources/phases/{phase} | Update phase |
| [**d675b0fdc020c9506b62049495c84c4d**](PlanningPhasesApi.md#d675b0fdc020c9506b62049495c84c4d) | **POST** /v2/datasources/project/{project}/phases | Create project phase |



## _0311da1cea655bc2d1604d7d41b7bfd9

> _0311da1cea655bc2d1604d7d41b7bfd9(phase)

Delete phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { 0311da1cea655bc2d1604d7d41b7bfd9Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number
    phase: 789,
  } satisfies 0311da1cea655bc2d1604d7d41b7bfd9Request;

  try {
    const data = await api._0311da1cea655bc2d1604d7d41b7bfd9(body);
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
| **phase** | `number` |  | [Defaults to `undefined`] |

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
| **204** | Phase deleted |  -  |
| **500** | Could not delete allocation type allocation. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## _0d3e5e87594938822a3f4342dad62f36

> Phase _0d3e5e87594938822a3f4342dad62f36(phase)

Show phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { 0d3e5e87594938822a3f4342dad62f36Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number
    phase: 789,
  } satisfies 0d3e5e87594938822a3f4342dad62f36Request;

  try {
    const data = await api._0d3e5e87594938822a3f4342dad62f36(body);
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
| **phase** | `number` |  | [Defaults to `undefined`] |

### Return type

[**Phase**](Phase.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Phase |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## _83ce4b16b2af73d27a64fb48ae1fc62f

> Array&lt;Phase&gt; _83ce4b16b2af73d27a64fb48ae1fc62f(project)

List project phases

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { 83ce4b16b2af73d27a64fb48ae1fc62fRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number | Project identifier
    project: 789,
  } satisfies 83ce4b16b2af73d27a64fb48ae1fc62fRequest;

  try {
    const data = await api._83ce4b16b2af73d27a64fb48ae1fc62f(body);
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
| **project** | `number` | Project identifier | [Defaults to `undefined`] |

### Return type

[**Array&lt;Phase&gt;**](Phase.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Phases |  -  |
| **500** | The entity is not a project. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## ad1d21e7985e497ed7c5ff220ac5ead2

> Phase ad1d21e7985e497ed7c5ff220ac5ead2(phase, phaseUpdatePayload)

Update phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { Ad1d21e7985e497ed7c5ff220ac5ead2Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number
    phase: 789,
    // PhaseUpdatePayload
    phaseUpdatePayload: ...,
  } satisfies Ad1d21e7985e497ed7c5ff220ac5ead2Request;

  try {
    const data = await api.ad1d21e7985e497ed7c5ff220ac5ead2(body);
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
| **phase** | `number` |  | [Defaults to `undefined`] |
| **phaseUpdatePayload** | [PhaseUpdatePayload](PhaseUpdatePayload.md) |  | |

### Return type

[**Phase**](Phase.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Phase |  -  |
| **500** | Failed to update phase |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## d675b0fdc020c9506b62049495c84c4d

> Phase d675b0fdc020c9506b62049495c84c4d(project, phaseCreatePayload)

Create project phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { D675b0fdc020c9506b62049495c84c4dRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number | Project identifier
    project: 789,
    // PhaseCreatePayload
    phaseCreatePayload: ...,
  } satisfies D675b0fdc020c9506b62049495c84c4dRequest;

  try {
    const data = await api.d675b0fdc020c9506b62049495c84c4d(body);
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
| **project** | `number` | Project identifier | [Defaults to `undefined`] |
| **phaseCreatePayload** | [PhaseCreatePayload](PhaseCreatePayload.md) |  | |

### Return type

[**Phase**](Phase.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Phase |  -  |
| **500** | Failed to create phase |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

