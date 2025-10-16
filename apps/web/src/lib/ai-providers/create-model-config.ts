import { BedrockProviderOptions } from '@ai-sdk/amazon-bedrock';
import { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { OpenRouterProviderOptions } from '@openrouter/ai-sdk-provider';
import { LanguageModel } from 'ai';

import { AIProvider } from '@/database/schema';

import createAmazonBedrockProvider from './factories/amazon-bedrock-factory';
import createAnthropicProvider from './factories/anthropic-factory';
import createOpenRouterProvider from './factories/openrouter-factory';

// Map provider names to their option types
type ProviderOptionsMap = {
  openrouter: OpenRouterProviderOptions;
  anthropic: AnthropicProviderOptions;
  'amazon-bedrock': BedrockProviderOptions;
};

type ContextManagementConfig = {
  enabled: boolean;
  edits?: Array<{ type: string; [key: string]: unknown }>;
};

type TransformsConfig = {
  enabled: boolean;
  transforms?: string[];
};

type ModelConfig<T extends AIProvider> = {
  model: LanguageModel;
  providerOptions?: { [K in T]: ProviderOptionsMap[K] };
};

type ModelConfigOptions<T extends AIProvider> = {
  providerOptions?: Partial<ProviderOptionsMap[T]>;
  contextManagement?: ContextManagementConfig;
  transforms?: TransformsConfig;
};

/**
 * Creates a language model configuration with provider-specific options.
 *
 * This function provides type-safe access to provider-specific features like
 * reasoning/thinking capabilities. The `options` parameter is automatically
 * typed based on the selected provider.
 *
 * Reasoning Support:
 *
 * - OpenRouter: Supports reasoning via options.reasoning.max_tokens
 * - Anthropic: Supports thinking via options.thinking (models:
 *   claude-opus-4-20250514, claude-sonnet-4-20250514,
 *   claude-3-7-sonnet-20250219)
 * - Amazon Bedrock: Supports reasoningConfig via options.reasoningConfig (model:
 *   claude-3-7-sonnet-20250219, min: 1024, max: 64000 tokens)
 *
 * Prompt Caching (Context Optimization):
 *
 * - Anthropic: Supports prompt caching via options.cacheControl to optimize
 *   conversation context. Mark static content (system prompts, knowledge base
 *   documents) with cache breakpoints to reduce latency and cost.
 *
 * @example
 *   ```ts
 *   // OpenRouter with reasoning
 *   const config = createModelConfig('openrouter', 'gpt-4', {
 *     reasoning: { max_tokens: 10000 }
 *   });
 *
 *   // Anthropic with thinking
 *   const config = createModelConfig('anthropic', 'claude-opus-4-20250514', {
 *     thinking: { type: 'enabled', budgetTokens: 10000 }
 *   });
 *
 *   // Anthropic with prompt caching for context optimization
 *   const config = createModelConfig('anthropic', 'claude-sonnet-4-20250514', {
 *     cacheControl: { type: 'ephemeral' }
 *   });
 *
 *   // Use in streamText
 *   await streamText({ ...config, messages: [...] });
 *   ```;
 *
 * @param provider - The AI provider name ('openrouter', 'anthropic',
 *   'amazon-bedrock')
 * @param modelName - The model identifier to use
 * @param options - Provider-specific options (automatically typed based on
 *   provider)
 * @returns Object containing the model instance and optional providerOptions
 */
const createModelConfig = <T extends AIProvider>(
  provider: T,
  modelName: string,
  options?: ModelConfigOptions<T>
): ModelConfig<T> => {
  const { providerOptions, contextManagement, transforms } = options ?? {};

  switch (provider) {
    case 'openrouter': {
      const openrouter = createOpenRouterProvider(transforms);
      return {
        model: openrouter(modelName),
        ...(providerOptions && {
          providerOptions: {
            openrouter: providerOptions as OpenRouterProviderOptions
          }
        })
      } as ModelConfig<T>;
    }

    case 'anthropic': {
      const anthropic = createAnthropicProvider(contextManagement);
      return {
        model: anthropic(modelName),
        ...(providerOptions && {
          providerOptions: {
            anthropic: providerOptions as AnthropicProviderOptions
          }
        })
      } as ModelConfig<T>;
    }

    case 'amazon-bedrock': {
      const amazonBedrock = createAmazonBedrockProvider();
      return {
        model: amazonBedrock(modelName),
        ...(providerOptions && {
          providerOptions: {
            bedrock: providerOptions as BedrockProviderOptions
          }
        })
      } as ModelConfig<T>;
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
};

export default createModelConfig;
