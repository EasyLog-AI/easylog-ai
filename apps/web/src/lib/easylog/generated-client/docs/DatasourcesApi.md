# DatasourcesApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**listDatasources**](DatasourcesApi.md#listdatasources) | **GET** /v2/datasources | List datasources for the authenticated client |
| [**listResources**](DatasourcesApi.md#listresources) | **GET** /v2/datasources/resources | List resource entities |
| [**showDatasource**](DatasourcesApi.md#showdatasource) | **GET** /v2/datasources/{entity} | Retrieve a single datasource |
| [**showDatasourceEntry**](DatasourcesApi.md#showdatasourceentry) | **GET** /v2/datasources/{entity}/entries/{entityDatum} | Show datasource entry |
| [**showResource**](DatasourcesApi.md#showresource) | **GET** /v2/datasources/resources/{resource} | Retrieve a resource |
| [**showResourceByGroup**](DatasourcesApi.md#showresourcebygroup) | **GET** /v2/datasources/resources/{resource}/{slug} | Retrieve resource data by group |



## listDatasources

> EntityCollection listDatasources(types)

List datasources for the authenticated client

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { ListDatasourcesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // Array<string> | Filter by entity types (optional)
    types: ...,
  } satisfies ListDatasourcesRequest;

  try {
    const data = await api.listDatasources(body);
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
| **types** | `Array<string>` | Filter by entity types | [Optional] |

### Return type

[**EntityCollection**](EntityCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Datasources |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listResources

> ResourceCollection listResources()

List resource entities

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { ListResourcesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  try {
    const data = await api.listResources();
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

[**ResourceCollection**](ResourceCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Resources |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showDatasource

> ShowDatasource200Response showDatasource(entity)

Retrieve a single datasource

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { ShowDatasourceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // number | Datasource identifier
    entity: 789,
  } satisfies ShowDatasourceRequest;

  try {
    const data = await api.showDatasource(body);
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
| **entity** | `number` | Datasource identifier | [Defaults to `undefined`] |

### Return type

[**ShowDatasource200Response**](ShowDatasource200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Datasource |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showDatasourceEntry

> ShowDatasourceEntry200Response showDatasourceEntry(entity, entityDatum)

Show datasource entry

Retrieve a specific entry (entity datum) from a datasource entity.

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { ShowDatasourceEntryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new DatasourcesApi(config);

  const body = {
    // number | Entity (datasource) ID
    entity: 789,
    // number | Entity datum (entry) ID
    entityDatum: 789,
  } satisfies ShowDatasourceEntryRequest;

  try {
    const data = await api.showDatasourceEntry(body);
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
| **entity** | `number` | Entity (datasource) ID | [Defaults to `undefined`] |
| **entityDatum** | `number` | Entity datum (entry) ID | [Defaults to `undefined`] |

### Return type

[**ShowDatasourceEntry200Response**](ShowDatasourceEntry200Response.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Entity datum |  -  |
| **404** | Entity or entry not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showResource

> ResourceCollection showResource(resource)

Retrieve a resource

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { ShowResourceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // number | Resource identifier
    resource: 789,
  } satisfies ShowResourceRequest;

  try {
    const data = await api.showResource(body);
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

### Return type

[**ResourceCollection**](ResourceCollection.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Resource |  -  |
| **500** | Resource not available |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showResourceByGroup

> ShowResourceByGroup200Response showResourceByGroup(resource, slug)

Retrieve resource data by group

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { ShowResourceByGroupRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // number | Resource identifier
    resource: 789,
    // string | Resource group slug
    slug: slug_example,
  } satisfies ShowResourceByGroupRequest;

  try {
    const data = await api.showResourceByGroup(body);
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

### Return type

[**ShowResourceByGroup200Response**](ShowResourceByGroup200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Resource data |  -  |
| **500** | Resource not available |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

