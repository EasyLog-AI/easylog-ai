# PlanningPhasesApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createProjectPhase**](PlanningPhasesApi.md#createprojectphase) | **POST** /v2/datasources/project/{project}/phases | Create project phase |
| [**deleteProjectPhase**](PlanningPhasesApi.md#deleteprojectphase) | **DELETE** /v2/datasources/phases/{phase} | Delete phase |
| [**listProjectPhases**](PlanningPhasesApi.md#listprojectphases) | **GET** /v2/datasources/project/{project}/phases | List project phases |
| [**showProjectPhase**](PlanningPhasesApi.md#showprojectphase) | **GET** /v2/datasources/phases/{phase} | Show phase |
| [**updateProjectPhase**](PlanningPhasesApi.md#updateprojectphase) | **PATCH** /v2/datasources/phases/{phase} | Update phase |



## createProjectPhase

> Phase createProjectPhase(project, phaseCreatePayload)

Create project phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { CreateProjectPhaseRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number | Project identifier
    project: 789,
    // PhaseCreatePayload
    phaseCreatePayload: ...,
  } satisfies CreateProjectPhaseRequest;

  try {
    const data = await api.createProjectPhase(body);
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


## deleteProjectPhase

> deleteProjectPhase(phase)

Delete phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { DeleteProjectPhaseRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number
    phase: 789,
  } satisfies DeleteProjectPhaseRequest;

  try {
    const data = await api.deleteProjectPhase(body);
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


## listProjectPhases

> Array&lt;Phase&gt; listProjectPhases(project)

List project phases

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { ListProjectPhasesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number | Project identifier
    project: 789,
  } satisfies ListProjectPhasesRequest;

  try {
    const data = await api.listProjectPhases(body);
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


## showProjectPhase

> Phase showProjectPhase(phase)

Show phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { ShowProjectPhaseRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number
    phase: 789,
  } satisfies ShowProjectPhaseRequest;

  try {
    const data = await api.showProjectPhase(body);
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


## updateProjectPhase

> Phase updateProjectPhase(phase, phaseUpdatePayload)

Update phase

### Example

```ts
import {
  Configuration,
  PlanningPhasesApi,
} from '';
import type { UpdateProjectPhaseRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new PlanningPhasesApi();

  const body = {
    // number
    phase: 789,
    // PhaseUpdatePayload
    phaseUpdatePayload: ...,
  } satisfies UpdateProjectPhaseRequest;

  try {
    const data = await api.updateProjectPhase(body);
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

