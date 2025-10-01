import { z } from 'zod';

const openIDDiscoverySchema = z.object({
  issuer: z.string().url(),
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url().optional(),
  userinfo_endpoint: z.string().url().optional(),
  jwks_uri: z.string().url(),
  registration_endpoint: z.string().url().optional(),

  response_types_supported: z.array(z.string()),
  response_modes_supported: z.array(z.string()).optional(),
  grant_types_supported: z.array(z.string()).optional(),
  subject_types_supported: z.array(z.string()),
  id_token_signing_alg_values_supported: z.array(z.string()),
  id_token_encryption_alg_values_supported: z.array(z.string()).optional(),
  id_token_encryption_enc_values_supported: z.array(z.string()).optional(),

  token_endpoint_auth_methods_supported: z.array(z.string()).optional(),
  token_endpoint_auth_signing_alg_values_supported: z
    .array(z.string())
    .optional(),

  introspection_endpoint: z.string().url().optional(),
  introspection_endpoint_auth_methods_supported: z.array(z.string()).optional(),

  revocation_endpoint: z.string().url().optional(),
  revocation_endpoint_auth_methods_supported: z.array(z.string()).optional(),

  code_challenge_methods_supported: z.array(z.string()).optional(),
  scopes_supported: z.array(z.string()).optional(),
  claims_supported: z.array(z.string()).optional(),
  request_uri_parameter_supported: z.boolean().optional(),
  request_parameter_supported: z.boolean().optional(),
  claims_parameter_supported: z.boolean().optional(),
  require_request_uri_registration: z.boolean().optional(),
  end_session_endpoint: z.string().url().optional()
});

export type OpenIDDiscovery = z.infer<typeof openIDDiscoverySchema>;

export default openIDDiscoverySchema;
