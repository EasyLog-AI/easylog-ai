# ConfigurationApi

All URIs are relative to _/api_

| Method                                                                   | HTTP request              | Description              |
| ------------------------------------------------------------------------ | ------------------------- | ------------------------ |
| [**getClientConfiguration**](ConfigurationApi.md#getclientconfiguration) | **GET** /v2/configuration | Get client configuration |

## getClientConfiguration

> ClientConfigurationResource getClientConfiguration()

Get client configuration

Retrieve the authenticated user\&#39;s client configuration including default time periods, planning filters, and permissions.

### Example

```ts
import { Configuration, ConfigurationApi } from '';
import type { GetClientConfigurationRequest } from '';

async function example() {
  console.log('🚀 Testing  SDK...');
  const config = new Configuration({
    // To configure OAuth2 access token for authorization: passport password
    accessToken: 'YOUR ACCESS TOKEN'
  });
  const api = new ConfigurationApi(config);

  try {
    const data = await api.getClientConfiguration();
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

[**ClientConfigurationResource**](ClientConfigurationResource.md)

### Authorization

[passport password](../README.md#passport-password)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`

### HTTP response details

| Status code | Description          | Response headers |
| ----------- | -------------------- | ---------------- |
| **200**     | Client configuration | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
