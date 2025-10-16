# PlanningApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**_0b5ba3d62e93a3ed3e284afd7601dc64**](PlanningApi.md#_0b5ba3d62e93a3ed3e284afd7601dc64) | **DELETE** /v2/datasources/projects/{project} | Delete project |
| [**_74eee5830a4b7a7dcf6cfa37fdc05cc6**](PlanningApi.md#_74eee5830a4b7a7dcf6cfa37fdc05cc6) | **GET** /v2/datasources/projects | List projects |
| [**_8758805bf050a2cd9ec432cb31bf8a94**](PlanningApi.md#_8758805bf050a2cd9ec432cb31bf8a94) | **GET** /v2/datasources/projects/{project} | Show project |
| [**_9087972305479790db2ba10ea4171932**](PlanningApi.md#_9087972305479790db2ba10ea4171932) | **POST** /v2/datasources/projects | Create project |
| [**b11778cc2f15aa8c6df61b6fb5f4b2cc**](PlanningApi.md#b11778cc2f15aa8c6df61b6fb5f4b2cc) | **PATCH** /v2/datasources/projects/{project} | Update project |
| [**c7fe599e2a4b018c9c0eb211a038b108**](PlanningApi.md#c7fe599e2a4b018c9c0eb211a038b108) | **GET** /v2/datasources/resources/{resource}/projects/{slug} | List projects for a resource group |



## _0b5ba3d62e93a3ed3e284afd7601dc64

> _0b5ba3d62e93a3ed3e284afd7601dc64(project)

Delete project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { 0b5ba3d62e93a3ed3e284afd7601dc64Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // number
    project: 789,
  } satisfies 0b5ba3d62e93a3ed3e284afd7601dc64Request;

  try {
    const data = await api._0b5ba3d62e93a3ed3e284afd7601dc64(body);
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
| **project** | `number` |  | [Defaults to `undefined`] |

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
| **204** | Project deleted |  -  |
| **500** | Could not delete project. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## _74eee5830a4b7a7dcf6cfa37fdc05cc6

> ProjectCollection _74eee5830a4b7a7dcf6cfa37fdc05cc6(types, startDate, endDate)

List projects

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { 74eee5830a4b7a7dcf6cfa37fdc05cc6Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // Array<string> | Filter projects by datasource slug (optional)
    types: ...,
    // Date | Return projects starting on or after this date (optional)
    startDate: 2013-10-20,
    // Date | Return projects ending on or before this date (optional)
    endDate: 2013-10-20,
  } satisfies 74eee5830a4b7a7dcf6cfa37fdc05cc6Request;

  try {
    const data = await api._74eee5830a4b7a7dcf6cfa37fdc05cc6(body);
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
| **types** | `Array<string>` | Filter projects by datasource slug | [Optional] |
| **startDate** | `Date` | Return projects starting on or after this date | [Optional] [Defaults to `undefined`] |
| **endDate** | `Date` | Return projects ending on or before this date | [Optional] [Defaults to `undefined`] |

### Return type

[**ProjectCollection**](ProjectCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Projects |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## _8758805bf050a2cd9ec432cb31bf8a94

> Project _8758805bf050a2cd9ec432cb31bf8a94(project, startDate, endDate)

Show project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { 8758805bf050a2cd9ec432cb31bf8a94Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // number | Project identifier
    project: 789,
    // Date | Filter allocations starting on or after this date (optional)
    startDate: 2013-10-20,
    // Date | Filter allocations ending on or before this date (optional)
    endDate: 2013-10-20,
  } satisfies 8758805bf050a2cd9ec432cb31bf8a94Request;

  try {
    const data = await api._8758805bf050a2cd9ec432cb31bf8a94(body);
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
| **startDate** | `Date` | Filter allocations starting on or after this date | [Optional] [Defaults to `undefined`] |
| **endDate** | `Date` | Filter allocations ending on or before this date | [Optional] [Defaults to `undefined`] |

### Return type

[**Project**](Project.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Project |  -  |
| **500** | The entity is not a project. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## _9087972305479790db2ba10ea4171932

> Project _9087972305479790db2ba10ea4171932(requestBody)

Create project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { 9087972305479790db2ba10ea4171932Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // { [key: string]: string; }
    requestBody: Object,
  } satisfies 9087972305479790db2ba10ea4171932Request;

  try {
    const data = await api._9087972305479790db2ba10ea4171932(body);
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
| **requestBody** | `{ [key: string]: string; }` |  | |

### Return type

[**Project**](Project.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Project |  -  |
| **400** | Could not store project, client id invalid. |  -  |
| **403** | Forbidden |  -  |
| **500** | Could not store project. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## b11778cc2f15aa8c6df61b6fb5f4b2cc

> Project b11778cc2f15aa8c6df61b6fb5f4b2cc(project, requestBody)

Update project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { B11778cc2f15aa8c6df61b6fb5f4b2ccRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // number
    project: 789,
    // { [key: string]: string; }
    requestBody: Object,
  } satisfies B11778cc2f15aa8c6df61b6fb5f4b2ccRequest;

  try {
    const data = await api.b11778cc2f15aa8c6df61b6fb5f4b2cc(body);
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
| **project** | `number` |  | [Defaults to `undefined`] |
| **requestBody** | `{ [key: string]: string; }` |  | |

### Return type

[**Project**](Project.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Project |  -  |
| **500** | Could not update project. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## c7fe599e2a4b018c9c0eb211a038b108

> Array&lt;object&gt; c7fe599e2a4b018c9c0eb211a038b108(resource, slug, startDate, endDate)

List projects for a resource group

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { C7fe599e2a4b018c9c0eb211a038b108Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // number | Resource identifier
    resource: 789,
    // string | Resource group slug
    slug: slug_example,
    // Date | Filter allocations starting on or after this date (optional)
    startDate: 2013-10-20,
    // Date | Filter allocations ending on or before this date (optional)
    endDate: 2013-10-20,
  } satisfies C7fe599e2a4b018c9c0eb211a038b108Request;

  try {
    const data = await api.c7fe599e2a4b018c9c0eb211a038b108(body);
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
| **resource** | `number` | Resource identifier | [Defaults to `undefined`] |
| **slug** | `string` | Resource group slug | [Defaults to `undefined`] |
| **startDate** | `Date` | Filter allocations starting on or after this date | [Optional] [Defaults to `undefined`] |
| **endDate** | `Date` | Filter allocations ending on or before this date | [Optional] [Defaults to `undefined`] |

### Return type

**Array<object>**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Projects |  -  |
| **500** | The entity is not a resource. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

