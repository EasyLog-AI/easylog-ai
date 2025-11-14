# SubmissionsApi

All URIs are relative to _/api_

| Method                                                                | HTTP request                                    | Description                     |
| --------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------- |
| [**deleteSubmission**](SubmissionsApi.md#deletesubmission)            | **DELETE** /v2/submissions/{submission}         | Delete submission               |
| [**listSubmissionMedia**](SubmissionsApi.md#listsubmissionmedia)      | **GET** /v2/submissions/{submission}/media      | List media for a submission     |
| [**listSubmissions**](SubmissionsApi.md#listsubmissions)              | **GET** /v2/submissions                         | List submissions (paginated)    |
| [**persistSubmission**](SubmissionsApi.md#persistsubmissionoperation) | **POST** /v2/submissions/{project_form}/persist | Persist submission              |
| [**prepareSubmission**](SubmissionsApi.md#preparesubmissionoperation) | **POST** /v2/submissions/{project_form}/prepare | Prepare submission file uploads |
| [**showSubmission**](SubmissionsApi.md#showsubmission)                | **GET** /v2/submissions/{submission}            | Show submission                 |
| [**updateSubmission**](SubmissionsApi.md#updatesubmission)            | **PATCH** /v2/submissions/{submission}          | Update submission               |
| [**uploadSubmissionMedia**](SubmissionsApi.md#uploadsubmissionmedia)  | **POST** /v2/submissions/{submission}/media     | Upload media to a submission    |

## deleteSubmission

> deleteSubmission(submission)

Delete submission

Delete a submission and all associated media. Users can only delete submissions they created or if they have ViewAllSubmissions permission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { DeleteSubmissionRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Submission ID
    submission: 789
  } satisfies DeleteSubmissionRequest;

  try {
    const data = await api.deleteSubmission(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description   | Notes                     |
| -------------- | -------- | ------------- | ------------------------- |
| **submission** | `number` | Submission ID | [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: Not defined

### HTTP response details

| Status code | Description                                          | Response headers |
| ----------- | ---------------------------------------------------- | ---------------- |
| **204**     | Submission deleted                                   | -                |
| **403**     | Forbidden - not authorized to delete this submission | -                |
| **404**     | Submission not found                                 | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## listSubmissionMedia

> ListFollowUpEntryMedia200Response listSubmissionMedia(submission)

List media for a submission

Get all media files attached to a submission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { ListSubmissionMediaRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Submission ID
    submission: 789
  } satisfies ListSubmissionMediaRequest;

  try {
    const data = await api.listSubmissionMedia(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description   | Notes                     |
| -------------- | -------- | ------------- | ------------------------- |
| **submission** | `number` | Submission ID | [Defaults to `undefined`] |

### Return type

[**ListFollowUpEntryMedia200Response**](ListFollowUpEntryMedia200Response.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                        | Response headers |
| ----------- | -------------------------------------------------- | ---------------- |
| **200**     | Media collection                                   | -                |
| **403**     | Forbidden - not authorized to view this submission | -                |
| **404**     | Submission not found                               | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## listSubmissions

> SubmissionCollection listSubmissions(page, projectFormId, issuerId, from, to, \_with, perPage)

List submissions (paginated)

List all submissions for the current user. Regular users only see their own submissions. Users with ViewAllSubmissions permission can see all submissions in their client and filter by issuer_id.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { ListSubmissionsRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Page number (optional)
    page: 56,
    // number | Filter by project form ID (optional)
    projectFormId: 789,
    // number | Filter by issuer user ID (requires ViewAllSubmissions permission or see_other_submissions access) (optional)
    issuerId: 789,
    // Date | Filter submissions created from this date (optional)
    from: 2013 - 10 - 20,
    // Date | Filter submissions created until this date (optional)
    to: 2013 - 10 - 20,
    // string | Comma-separated list of relationships to eager load (projectForm, issuer, media) (optional)
    _with: projectForm,
    issuer,
    media,
    // number | Number of items per page (1-100) (optional)
    perPage: 56
  } satisfies ListSubmissionsRequest;

  try {
    const data = await api.listSubmissions(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name              | Type     | Description                                                                                       | Notes                                |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **page**          | `number` | Page number                                                                                       | [Optional] [Defaults to `1`]         |
| **projectFormId** | `number` | Filter by project form ID                                                                         | [Optional] [Defaults to `undefined`] |
| **issuerId**      | `number` | Filter by issuer user ID (requires ViewAllSubmissions permission or see_other_submissions access) | [Optional] [Defaults to `undefined`] |
| **from**          | `Date`   | Filter submissions created from this date                                                         | [Optional] [Defaults to `undefined`] |
| **to**            | `Date`   | Filter submissions created until this date                                                        | [Optional] [Defaults to `undefined`] |
| **\_with**        | `string` | Comma-separated list of relationships to eager load (projectForm, issuer, media)                  | [Optional] [Defaults to `undefined`] |
| **perPage**       | `number` | Number of items per page (1-100)                                                                  | [Optional] [Defaults to `25`]        |

### Return type

[**SubmissionCollection**](SubmissionCollection.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                                 | Response headers |
| ----------- | ----------------------------------------------------------- | ---------------- |
| **200**     | Paginated submissions collection                            | -                |
| **403**     | Forbidden - insufficient permissions to filter by issuer_id | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## persistSubmission

> PersistSubmission201Response persistSubmission(projectForm, persistSubmissionRequest)

Persist submission

Create and persist a new submission with form data and uploaded files. Files should be uploaded first using the prepare endpoint. Supports both POST and PUT methods for compatibility.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { PersistSubmissionOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Project form ID
    projectForm: 789,
    // PersistSubmissionRequest
    persistSubmissionRequest: ...,
  } satisfies PersistSubmissionOperationRequest;

  try {
    const data = await api.persistSubmission(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                         | Type                                                    | Description     | Notes                     |
| ---------------------------- | ------------------------------------------------------- | --------------- | ------------------------- |
| **projectForm**              | `number`                                                | Project form ID | [Defaults to `undefined`] |
| **persistSubmissionRequest** | [PersistSubmissionRequest](PersistSubmissionRequest.md) |                 |                           |

### Return type

[**PersistSubmission201Response**](PersistSubmission201Response.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                     | Response headers |
| ----------- | ------------------------------- | ---------------- |
| **201**     | Submission created              | -                |
| **400**     | Invalid data or file tokens     | -                |
| **404**     | Project form not found          | -                |
| **422**     | Validation error                | -                |
| **500**     | Server error during persistence | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## prepareSubmission

> PrepareSubmission200Response prepareSubmission(projectForm, prepareSubmissionRequest)

Prepare submission file uploads

Prepare file uploads for a submission by generating pre-signed S3 URLs. Call this before persisting the submission if files need to be uploaded.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { PrepareSubmissionOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Project form ID
    projectForm: 789,
    // PrepareSubmissionRequest
    prepareSubmissionRequest: ...,
  } satisfies PrepareSubmissionOperationRequest;

  try {
    const data = await api.prepareSubmission(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                         | Type                                                    | Description     | Notes                     |
| ---------------------------- | ------------------------------------------------------- | --------------- | ------------------------- |
| **projectForm**              | `number`                                                | Project form ID | [Defaults to `undefined`] |
| **prepareSubmissionRequest** | [PrepareSubmissionRequest](PrepareSubmissionRequest.md) |                 |                           |

### Return type

[**PrepareSubmission200Response**](PrepareSubmission200Response.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description            | Response headers |
| ----------- | ---------------------- | ---------------- |
| **200**     | Pre-signed upload URLs | -                |
| **404**     | Project form not found | -                |
| **422**     | Validation error       | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## showSubmission

> SubmissionResource showSubmission(submission)

Show submission

Display a specific submission. Users can only view submissions they created or if they have ViewAllSubmissions permission.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { ShowSubmissionRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Submission ID
    submission: 789
  } satisfies ShowSubmissionRequest;

  try {
    const data = await api.showSubmission(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description   | Notes                     |
| -------------- | -------- | ------------- | ------------------------- |
| **submission** | `number` | Submission ID | [Defaults to `undefined`] |

### Return type

[**SubmissionResource**](SubmissionResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                        | Response headers |
| ----------- | -------------------------------------------------- | ---------------- |
| **200**     | Submission                                         | -                |
| **403**     | Forbidden - not authorized to view this submission | -                |
| **404**     | Submission not found                               | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## updateSubmission

> SubmissionResource updateSubmission(submission, updateSubmissionInput)

Update submission

Update submission data. Users can only update submissions they created or if they have ViewAllSubmissions permission. Only the data field can be updated.

### Example

```ts
import {
  Configuration,
  SubmissionsApi,
} from '';
import type { UpdateSubmissionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: "YOUR ACCESS TOKEN",
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Submission ID
    submission: 789,
    // UpdateSubmissionInput
    updateSubmissionInput: ...,
  } satisfies UpdateSubmissionRequest;

  try {
    const data = await api.updateSubmission(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description   | Notes                     |
| ------------------------- | ------------------------------------------------- | ------------- | ------------------------- |
| **submission**            | `number`                                          | Submission ID | [Defaults to `undefined`] |
| **updateSubmissionInput** | [UpdateSubmissionInput](UpdateSubmissionInput.md) |               |                           |

### Return type

[**SubmissionResource**](SubmissionResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                          | Response headers |
| ----------- | ---------------------------------------------------- | ---------------- |
| **200**     | Updated submission                                   | -                |
| **403**     | Forbidden - not authorized to update this submission | -                |
| **404**     | Submission not found                                 | -                |
| **422**     | Validation error                                     | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## uploadSubmissionMedia

> UploadSubmissionMedia201Response uploadSubmissionMedia(submission, file)

Upload media to a submission

Upload a file and attach it to a submission. Maximum file size: 10MB.

### Example

```ts
import { Configuration, SubmissionsApi } from '';
import type { UploadSubmissionMediaRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new SubmissionsApi(config);

  const body = {
    // number | Submission ID
    submission: 789,
    // Blob | File to upload (max 10MB)
    file: BINARY_DATA_HERE
  } satisfies UploadSubmissionMediaRequest;

  try {
    const data = await api.uploadSubmissionMedia(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description               | Notes                     |
| -------------- | -------- | ------------------------- | ------------------------- |
| **submission** | `number` | Submission ID             | [Defaults to `undefined`] |
| **file**       | `Blob`   | File to upload (max 10MB) | [Defaults to `undefined`] |

### Return type

[**UploadSubmissionMedia201Response**](UploadSubmissionMedia201Response.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description                                          | Response headers |
| ----------- | ---------------------------------------------------- | ---------------- |
| **201**     | Media uploaded                                       | -                |
| **403**     | Forbidden - not authorized to update this submission | -                |
| **404**     | Submission not found                                 | -                |
| **422**     | Validation error                                     | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
