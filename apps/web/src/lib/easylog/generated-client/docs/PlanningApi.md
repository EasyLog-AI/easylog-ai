# PlanningApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createProject**](PlanningApi.md#createproject) | **POST** /v2/datasources/projects | Create project |
| [**createProjectInDatasource**](PlanningApi.md#createprojectindatasource) | **POST** /v2/datasources/{entity}/project | Create project in specific datasource |
| [**deleteProject**](PlanningApi.md#deleteproject) | **DELETE** /v2/datasources/projects/{project} | Delete project |
| [**listProjects**](PlanningApi.md#listprojects) | **GET** /v2/datasources/projects | List projects |
| [**listProjectsForResource**](PlanningApi.md#listprojectsforresource) | **GET** /v2/datasources/resources/{resource}/projects/{slug} | List projects for a resource group |
| [**showProject**](PlanningApi.md#showproject) | **GET** /v2/datasources/projects/{project} | Show project |
| [**updateProject**](PlanningApi.md#updateproject) | **PATCH** /v2/datasources/projects/{project} | Update project |



## createProject

> Project createProject(projectPayload)

Create project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { CreateProjectRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // ProjectPayload
    projectPayload: ...,
  } satisfies CreateProjectRequest;

  try {
    const data = await api.createProject(body);
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
| **projectPayload** | [ProjectPayload](ProjectPayload.md) |  | |

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


## createProjectInDatasource

> Project createProjectInDatasource(entity, projectPayload)

Create project in specific datasource

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { CreateProjectInDatasourceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // string | Datasource/Entity identifier (ID or slug)
    entity: entity_example,
    // ProjectPayload
    projectPayload: ...,
  } satisfies CreateProjectInDatasourceRequest;

  try {
    const data = await api.createProjectInDatasource(body);
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
| **entity** | `string` | Datasource/Entity identifier (ID or slug) | [Defaults to `undefined`] |
| **projectPayload** | [ProjectPayload](ProjectPayload.md) |  | |

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


## deleteProject

> deleteProject(project)

Delete project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { DeleteProjectRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // number
    project: 789,
  } satisfies DeleteProjectRequest;

  try {
    const data = await api.deleteProject(body);
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


## listProjects

> ProjectCollection listProjects(types, startDate, endDate)

List projects

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { ListProjectsRequest } from '';

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
  } satisfies ListProjectsRequest;

  try {
    const data = await api.listProjects(body);
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


## listProjectsForResource

> Array&lt;object&gt; listProjectsForResource(resource, slug, startDate, endDate)

List projects for a resource group

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { ListProjectsForResourceRequest } from '';

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
  } satisfies ListProjectsForResourceRequest;

  try {
    const data = await api.listProjectsForResource(body);
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


## showProject

> Project showProject(project, startDate, endDate)

Show project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { ShowProjectRequest } from '';

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
  } satisfies ShowProjectRequest;

  try {
    const data = await api.showProject(body);
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


## updateProject

> Project updateProject(project, projectPayload)

Update project

### Example

```ts
import {
  Configuration,
  PlanningApi,
} from '';
import type { UpdateProjectRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningApi();

  const body = {
    // number
    project: 789,
    // ProjectPayload
    projectPayload: ...,
  } satisfies UpdateProjectRequest;

  try {
    const data = await api.updateProject(body);
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
| **projectPayload** | [ProjectPayload](ProjectPayload.md) |  | |

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

