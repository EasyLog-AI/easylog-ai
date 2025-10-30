# CategoriesApi

All URIs are relative to _/api_

| Method                                                      | HTTP request                            | Description                 |
| ----------------------------------------------------------- | --------------------------------------- | --------------------------- |
| [**createCategory**](CategoriesApi.md#createcategory)       | **POST** /v2/categories                 | Create category             |
| [**deleteCategory**](CategoriesApi.md#deletecategory)       | **DELETE** /v2/categories/{category}    | Delete category             |
| [**listCategories**](CategoriesApi.md#listcategories)       | **GET** /v2/categories                  | List categories (paginated) |
| [**listCategoryForms**](CategoriesApi.md#listcategoryforms) | **GET** /v2/categories/{category}/forms | List forms in a category    |
| [**showCategory**](CategoriesApi.md#showcategory)           | **GET** /v2/categories/{category}       | Show category               |
| [**updateCategory**](CategoriesApi.md#updatecategory)       | **PATCH** /v2/categories/{category}     | Update category             |

## createCategory

> CategoryResource createCategory(storeCategoryInput)

Create category

Store a newly created resource in storage.

### Example

```ts
import {
  Configuration,
  CategoriesApi,
} from '';
import type { CreateCategoryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new CategoriesApi(config);

  const body = {
    // StoreCategoryInput
    storeCategoryInput: ...,
  } satisfies CreateCategoryRequest;

  try {
    const data = await api.createCategory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description | Notes |
| ---------------------- | ------------------------------------------- | ----------- | ----- |
| **storeCategoryInput** | [StoreCategoryInput](StoreCategoryInput.md) |             |       |

### Return type

[**CategoryResource**](CategoryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description      | Response headers |
| ----------- | ---------------- | ---------------- |
| **201**     | Created category | -                |
| **422**     | Validation error | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## deleteCategory

> deleteCategory(category)

Delete category

Remove the specified resource from storage.

### Example

```ts
import { Configuration, CategoriesApi } from '';
import type { DeleteCategoryRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new CategoriesApi(config);

  const body = {
    // number
    category: 56
  } satisfies DeleteCategoryRequest;

  try {
    const data = await api.deleteCategory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description | Notes                     |
| ------------ | -------- | ----------- | ------------------------- |
| **category** | `number` |             | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **204**     | Category deleted   | -                |
| **404**     | Category not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## listCategories

> CategoryCollection listCategories(page, perPage)

List categories (paginated)

Display a listing of the resource.

### Example

```ts
import { Configuration, CategoriesApi } from '';
import type { ListCategoriesRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new CategoriesApi(config);

  const body = {
    // number | Page number (optional)
    page: 56,
    // number | Number of items per page (1-100) (optional)
    perPage: 56
  } satisfies ListCategoriesRequest;

  try {
    const data = await api.listCategories(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name        | Type     | Description                      | Notes                         |
| ----------- | -------- | -------------------------------- | ----------------------------- |
| **page**    | `number` | Page number                      | [Optional] [Defaults to `1`]  |
| **perPage** | `number` | Number of items per page (1-100) | [Optional] [Defaults to `25`] |

### Return type

[**CategoryCollection**](CategoryCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                     | Response headers |
| ----------- | ------------------------------- | ---------------- |
| **200**     | Paginated categories collection | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## listCategoryForms

> FormCollection listCategoryForms(category)

List forms in a category

List forms in a category.

### Example

```ts
import { Configuration, CategoriesApi } from '';
import type { ListCategoryFormsRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new CategoriesApi(config);

  const body = {
    // number
    category: 56
  } satisfies ListCategoryFormsRequest;

  try {
    const data = await api.listCategoryForms(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description | Notes                     |
| ------------ | -------- | ----------- | ------------------------- |
| **category** | `number` |             | [Defaults to `undefined`] |

### Return type

[**FormCollection**](FormCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **200**     | Forms              | -                |
| **404**     | Category not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## showCategory

> CategoryResource showCategory(category)

Show category

Display the specified resource.

### Example

```ts
import { Configuration, CategoriesApi } from '';
import type { ShowCategoryRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new CategoriesApi(config);

  const body = {
    // number
    category: 56
  } satisfies ShowCategoryRequest;

  try {
    const data = await api.showCategory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description | Notes                     |
| ------------ | -------- | ----------- | ------------------------- |
| **category** | `number` |             | [Defaults to `undefined`] |

### Return type

[**CategoryResource**](CategoryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **200**     | Category           | -                |
| **404**     | Category not found | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## updateCategory

> CategoryResource updateCategory(category, updateCategoryInput)

Update category

Update the specified resource in storage.

### Example

```ts
import {
  Configuration,
  CategoriesApi,
} from '';
import type { UpdateCategoryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new CategoriesApi(config);

  const body = {
    // number
    category: 56,
    // UpdateCategoryInput
    updateCategoryInput: ...,
  } satisfies UpdateCategoryRequest;

  try {
    const data = await api.updateCategory(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type                                          | Description | Notes                     |
| ----------------------- | --------------------------------------------- | ----------- | ------------------------- |
| **category**            | `number`                                      |             | [Defaults to `undefined`] |
| **updateCategoryInput** | [UpdateCategoryInput](UpdateCategoryInput.md) |             |                           |

### Return type

[**CategoryResource**](CategoryResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description        | Response headers |
| ----------- | ------------------ | ---------------- |
| **200**     | Updated category   | -                |
| **404**     | Category not found | -                |
| **422**     | Validation error   | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
