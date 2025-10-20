# FormsApi

All URIs are relative to */api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**createForm**](FormsApi.md#createform) | **POST** /v2/forms | Create form |
| [**deleteForm**](FormsApi.md#deleteform) | **DELETE** /v2/forms/{form} | Delete form |
| [**getFormSchema**](FormsApi.md#getformschema) | **GET** /v2/forms/{form}/schema | Get form JSON schema |
| [**listFormCategories**](FormsApi.md#listformcategories) | **GET** /v2/forms/{form}/categories | List categories for a form |
| [**listFormProjectForms**](FormsApi.md#listformprojectforms) | **GET** /v2/forms/{form}/project-forms | List project forms for this form |
| [**listFormVersions**](FormsApi.md#listformversions) | **GET** /v2/forms/{form}/versions | List form versions |
| [**listForms**](FormsApi.md#listforms) | **GET** /v2/forms | List forms |
| [**showForm**](FormsApi.md#showform) | **GET** /v2/forms/{form} | Show form |
| [**updateForm**](FormsApi.md#updateform) | **PATCH** /v2/forms/{form} | Update form |



## createForm

> FormResource createForm(storeFormInput)

Create form

Store a newly created resource in storage.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { CreateFormRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // StoreFormInput
    storeFormInput: ...,
  } satisfies CreateFormRequest;

  try {
    const data = await api.createForm(body);
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
| **storeFormInput** | [StoreFormInput](StoreFormInput.md) |  | |

### Return type

[**FormResource**](FormResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **201** | Created form |  -  |
| **422** | Validation error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## deleteForm

> deleteForm(form)

Delete form

Remove the specified resource from storage.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { DeleteFormRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number
    form: 56,
  } satisfies DeleteFormRequest;

  try {
    const data = await api.deleteForm(body);
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
| **form** | `number` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **204** | Form deleted |  -  |
| **404** | Form not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getFormSchema

> getFormSchema(form)

Get form JSON schema

Get form JSON schema.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { GetFormSchemaRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number
    form: 56,
  } satisfies GetFormSchemaRequest;

  try {
    const data = await api.getFormSchema(body);
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
| **form** | `number` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Form schema |  -  |
| **404** | Form not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listFormCategories

> CategoryCollection listFormCategories(form)

List categories for a form

List categories for a form.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { ListFormCategoriesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number
    form: 56,
  } satisfies ListFormCategoriesRequest;

  try {
    const data = await api.listFormCategories(body);
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
| **form** | `number` |  | [Defaults to `undefined`] |

### Return type

[**CategoryCollection**](CategoryCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Categories |  -  |
| **404** | Form not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listFormProjectForms

> ProjectFormCollection listFormProjectForms(form)

List project forms for this form

Get all ProjectForms (form-to-project associations) for a specific form. This helps map from a form ID to project form IDs which are needed for submissions.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { ListFormProjectFormsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number | Form ID
    form: 56,
  } satisfies ListFormProjectFormsRequest;

  try {
    const data = await api.listFormProjectForms(body);
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
| **form** | `number` | Form ID | [Defaults to `undefined`] |

### Return type

[**ProjectFormCollection**](ProjectFormCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Project forms collection |  -  |
| **404** | Form not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listFormVersions

> listFormVersions(form)

List form versions

List form versions.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { ListFormVersionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number
    form: 56,
  } satisfies ListFormVersionsRequest;

  try {
    const data = await api.listFormVersions(body);
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
| **form** | `number` |  | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Form versions |  -  |
| **404** | Form not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## listForms

> FormCollection listForms()

List forms

Display a listing of the resource.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { ListFormsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  try {
    const data = await api.listForms();
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

[**FormCollection**](FormCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Forms collection |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## showForm

> FormResource showForm(form)

Show form

Display the specified resource.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { ShowFormRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number
    form: 56,
  } satisfies ShowFormRequest;

  try {
    const data = await api.showForm(body);
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
| **form** | `number` |  | [Defaults to `undefined`] |

### Return type

[**FormResource**](FormResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Form |  -  |
| **404** | Form not found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## updateForm

> FormResource updateForm(form, updateFormInput)

Update form

Update the specified resource in storage.

### Example

```ts
import {
  Configuration,
  FormsApi,
} from '';
import type { UpdateFormRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({ 
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new FormsApi(config);

  const body = {
    // number
    form: 56,
    // UpdateFormInput
    updateFormInput: ...,
  } satisfies UpdateFormRequest;

  try {
    const data = await api.updateForm(body);
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
| **form** | `number` |  | [Defaults to `undefined`] |
| **updateFormInput** | [UpdateFormInput](UpdateFormInput.md) |  | |

### Return type

[**FormResource**](FormResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Updated form |  -  |
| **404** | Form not found |  -  |
| **422** | Validation error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

