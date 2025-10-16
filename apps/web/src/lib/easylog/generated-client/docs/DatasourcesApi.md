# DatasourcesApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**_09ddae27e276f3ba7e37930c182b15fd**](DatasourcesApi.md#_09ddae27e276f3ba7e37930c182b15fd) | **GET** /v2/datasources/resources/{resource} | Retrieve a resource |
| [**_1fc1206aaba89a63335ac7991e0f5cc3**](DatasourcesApi.md#_1fc1206aaba89a63335ac7991e0f5cc3) | **GET** /v2/datasources/resources/{resource}/{slug} | Retrieve resource data by group |
| [**_2e63ab79cdb720663c3edf47fee45c62**](DatasourcesApi.md#_2e63ab79cdb720663c3edf47fee45c62) | **GET** /v2/datasources/{entity} | Retrieve a single datasource |
| [**_6a0a612ba4d6f5c36b9a17437b0e24da**](DatasourcesApi.md#_6a0a612ba4d6f5c36b9a17437b0e24da) | **GET** /v2/datasources | List datasources for the authenticated client |
| [**eaf34e7e001fc60bfae7ca7815847c0d**](DatasourcesApi.md#eaf34e7e001fc60bfae7ca7815847c0d) | **GET** /v2/datasources/resources | List resource entities |
| [**showDatasourceEntry**](DatasourcesApi.md#showdatasourceentry) | **GET** /v2/datasources/{entity}/entries/{entityDatum} | Show datasource entry |



## _09ddae27e276f3ba7e37930c182b15fd

> ResourceCollection _09ddae27e276f3ba7e37930c182b15fd(resource)

Retrieve a resource

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { 09ddae27e276f3ba7e37930c182b15fdRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // number | Resource identifier
    resource: 789,
  } satisfies 09ddae27e276f3ba7e37930c182b15fdRequest;

  try {
    const data = await api._09ddae27e276f3ba7e37930c182b15fd(body);
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


## _1fc1206aaba89a63335ac7991e0f5cc3

> Model1fc1206aaba89a63335ac7991e0f5cc3200Response _1fc1206aaba89a63335ac7991e0f5cc3(resource, slug)

Retrieve resource data by group

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { 1fc1206aaba89a63335ac7991e0f5cc3Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // number | Resource identifier
    resource: 789,
    // string | Resource group slug
    slug: slug_example,
  } satisfies 1fc1206aaba89a63335ac7991e0f5cc3Request;

  try {
    const data = await api._1fc1206aaba89a63335ac7991e0f5cc3(body);
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

[**Model1fc1206aaba89a63335ac7991e0f5cc3200Response**](Model1fc1206aaba89a63335ac7991e0f5cc3200Response.md)

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


## _2e63ab79cdb720663c3edf47fee45c62

> Model2e63ab79cdb720663c3edf47fee45c62200Response _2e63ab79cdb720663c3edf47fee45c62(entity)

Retrieve a single datasource

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { 2e63ab79cdb720663c3edf47fee45c62Request } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // number | Datasource identifier
    entity: 789,
  } satisfies 2e63ab79cdb720663c3edf47fee45c62Request;

  try {
    const data = await api._2e63ab79cdb720663c3edf47fee45c62(body);
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

[**Model2e63ab79cdb720663c3edf47fee45c62200Response**](Model2e63ab79cdb720663c3edf47fee45c62200Response.md)

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


## _6a0a612ba4d6f5c36b9a17437b0e24da

> EntityCollection _6a0a612ba4d6f5c36b9a17437b0e24da(types)

List datasources for the authenticated client

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { 6a0a612ba4d6f5c36b9a17437b0e24daRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  const body = {
    // Array<string> | Filter by entity types (optional)
    types: ...,
  } satisfies 6a0a612ba4d6f5c36b9a17437b0e24daRequest;

  try {
    const data = await api._6a0a612ba4d6f5c36b9a17437b0e24da(body);
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


## eaf34e7e001fc60bfae7ca7815847c0d

> ResourceCollection eaf34e7e001fc60bfae7ca7815847c0d()

List resource entities

### Example

```ts
import {
  Configuration,
  DatasourcesApi,
} from '';
import type { Eaf34e7e001fc60bfae7ca7815847c0dRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DatasourcesApi();

  try {
    const data = await api.eaf34e7e001fc60bfae7ca7815847c0d();
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

