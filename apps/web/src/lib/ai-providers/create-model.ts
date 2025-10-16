import { BedrockProviderOptions } from '@ai-sdk/amazon-bedrock';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { OpenRouterProviderOptions } from '@openrouter/ai-sdk-provider';

import { AIProvider } from '@/database/schema';

import createModelConfig from './create-model-config';
import effortToBudgetTokens from './utils/effort-to-budget-tokens';

// Map provider names to their option types
type ProviderOptionsMap = {
  openrouter: OpenRouterProviderOptions;
  anthropic: AnthropicProviderOptions;
  'amazon-bedrock': BedrockProviderOptions;
};

type ReasoningConfig = {
  enabled: boolean;
  effort: 'low' | 'medium' | 'high';
};

type CacheControlConfig = {
  enabled: boolean;
};

type ContextManagementConfig = {
  enabled: boolean;
  edits?: Array<{ type: string; [key: string]: unknown }>;
};

type TransformsConfig = {
  enabled: boolean;
  transforms?: string[];
};

type ModelOptions<T extends AIProvider> = {
  reasoning?: ReasoningConfig;
  cacheControl?: CacheControlConfig;
  contextManagement?: ContextManagementConfig;
  transforms?: TransformsConfig;
  providerOptions?: Partial<ProviderOptionsMap[T]>;
};

/**
 * Creates a language model configuration with optional reasoning and cache
 * control features.
 *
 * This function simplifies model configuration by accepting all optional
 * parameters in a single config object, eliminating the need to pass undefined
 * values for unused parameters.
 *
 * Features:
 *
 * - Reasoning: Extended thinking capabilities for complex tasks
 * - Cache Control: Prompt caching to reduce latency and cost (Anthropic only)
 * - Provider Options: Additional provider-specific settings (automatically typed
 *   based on the selected provider)
 *
 * Context Management API (Anthropic Beta):
 *
 * The Anthropic context management API allows you to modify conversation
 * context dynamically. To use this beta feature:
 *
 * 1. Add the beta header when creating the Anthropic provider instance in
 *    anthropic.ts:
 *
 *    ```ts
 *    const anthropic = createAnthropic({
 *      apiKey: serverConfig.anthropicApiKey,
 *      headers: {
 *        'anthropic-beta': 'context-management-2025-06-27'
 *      }
 *    });
 *    ```
 * 2. Use context management via direct API calls or custom fetch implementation
 *    (not yet fully supported in AI SDK v2)
 *
 * Note: Context management is currently in beta and requires special access.
 * For now, prompt caching via cacheControl is the recommended approach for
 * context optimization.
 *
 * @example
 *   ```ts
 *   // Basic usage (no options)
 *   const config = createModel('anthropic', 'claude-sonnet-4-20250514');
 *
 *   // With reasoning
 *   const config = createModel('anthropic', 'claude-sonnet-4-20250514', {
 *     reasoning: { enabled: true, effort: 'medium' }
 *   });
 *
 *   // With reasoning and cache control
 *   const config = createModel('anthropic', 'claude-sonnet-4-20250514', {
 *     reasoning: { enabled: true, effort: 'medium' },
 *     cacheControl: { enabled: true }
 *   });
 *   ```;
 *
 * @param provider - The AI provider name ('openrouter', 'anthropic',
 *   'amazon-bedrock')
 * @param modelName - The model identifier to use
 * @param options - Optional configuration object
 * @returns Model configuration with applied options
 */
const createModel = <T extends AIProvider>(
  provider: T,
  modelName: string,
  options?: ModelOptions<T>
) => {
  const {
    reasoning,
    cacheControl,
    contextManagement,
    transforms,
    providerOptions
  } = options ?? {};

  if (
    !reasoning?.enabled &&
    !cacheControl?.enabled &&
    !contextManagement?.enabled &&
    !transforms?.enabled
  ) {
    return createModelConfig(provider, modelName, {
      providerOptions,
      contextManagement,
      transforms
    });
  }

  const budgetTokens = reasoning?.enabled
    ? effortToBudgetTokens(reasoning.effort)
    : undefined;

  switch (provider) {
    case 'openrouter':
      return createModelConfig(provider, modelName, {
        providerOptions: {
          ...providerOptions,
          ...(reasoning?.enabled && {
            reasoning: { max_tokens: budgetTokens! }
          })
        } as Partial<ProviderOptionsMap[T]>,
        transforms
      });

    case 'anthropic':
      return createModelConfig(provider, modelName, {
        providerOptions: {
          ...providerOptions,
          ...(reasoning?.enabled && {
            thinking: { type: 'enabled', budgetTokens: budgetTokens! }
          }),
          ...(cacheControl?.enabled && {
            cacheControl: { type: 'ephemeral' }
          })
        } as Partial<ProviderOptionsMap[T]>,
        contextManagement
      });

    case 'amazon-bedrock':
      return createModelConfig(provider, modelName, {
        providerOptions: {
          ...providerOptions,
          ...(reasoning?.enabled && {
            reasoningConfig: {
              type: 'enabled',
              budgetTokens: Math.max(1024, budgetTokens!)
            }
          })
        } as Partial<ProviderOptionsMap[T]>
      });

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
};

export default createModel;
