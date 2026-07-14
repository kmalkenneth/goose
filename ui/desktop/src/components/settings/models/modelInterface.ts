import { acpListProviderDetails, acpListProviderModels } from '../../../acp/providers';
import type { ProviderDetails, ThinkingEffort } from '../../../types/providers';
import { errorMessage as getErrorMessage } from '../../../utils/conversionUtils';

const SIX_STATE_EFFORT_LEVELS: ThinkingEffort[] = ['off', 'low', 'medium', 'high', 'xhigh', 'max'];

const GPT56_EFFORT_LEVELS: Record<string, ThinkingEffort[]> = {
  'gpt-5.6-luna': SIX_STATE_EFFORT_LEVELS,
  'gpt-5.6-terra': SIX_STATE_EFFORT_LEVELS,
  'gpt-5.6-sol': SIX_STATE_EFFORT_LEVELS,
};

const FABLE5_EFFORT_LEVELS: Record<string, ThinkingEffort[]> = {
  'claude-fable-5': SIX_STATE_EFFORT_LEVELS,
};

const DEFAULT_REASONING_EFFORT_LEVELS: ThinkingEffort[] = ['off', 'low', 'medium', 'high', 'max'];

export function getModelReasoning(
  provider: string,
  model: string,
  fallback?: boolean | null
): boolean | null {
  const isSixStateModel =
    (provider === 'chatgpt_codex' && model in GPT56_EFFORT_LEVELS) ||
    (provider === 'anthropic' && model in FABLE5_EFFORT_LEVELS);
  if (isSixStateModel) {
    return fallback === false ? false : true;
  }

  return fallback ?? null;
}

export function getThinkingEffortLevels(
  provider: string,
  model: string,
  reasoning?: boolean | null
): ThinkingEffort[] | null {
  const isSixStateModel =
    (provider === 'chatgpt_codex' && model in GPT56_EFFORT_LEVELS) ||
    (provider === 'anthropic' && model in FABLE5_EFFORT_LEVELS);
  if (isSixStateModel && reasoning !== false) {
    return provider === 'chatgpt_codex' ? GPT56_EFFORT_LEVELS[model] : FABLE5_EFFORT_LEVELS[model];
  }

  if (reasoning === true) {
    return DEFAULT_REASONING_EFFORT_LEVELS;
  }
  return null;
}
export default interface Model {
  id?: number; // Make `id` optional to allow user-defined models
  name: string;
  provider: string;
  lastUsed?: string;
  alias?: string; // optional model display name
  subtext?: string; // goes below model name if not the provider
  context_limit?: number; // optional context limit override
  reasoning?: boolean; // optional reasoning/thinking support metadata
  request_params?: Record<string, unknown> & { thinking_effort?: ThinkingEffort }; // provider-specific request parameters
}

export function createModelStruct(
  modelName: string,
  provider: string,
  id?: number, // Make `id` optional to allow user-defined models
  lastUsed?: string,
  alias?: string, // optional model display name
  subtext?: string
): Model {
  // use the metadata to create a Model
  return {
    name: modelName,
    provider: provider,
    alias: alias,
    id: id,
    lastUsed: lastUsed,
    subtext: subtext,
  };
}

export async function getProviderMetadata(providerName: string) {
  const providers = await acpListProviderDetails();
  const matches = providers.find((providerMatch) => providerMatch.name === providerName);
  if (!matches) {
    throw Error(`No match for provider: ${providerName}`);
  }
  return matches.metadata;
}

export interface ProviderModelsResult {
  provider: ProviderDetails;
  models: Model[] | null;
  error: string | null;
  warning: string | null;
}

export async function fetchModelsForProviders(
  activeProviders: ProviderDetails[]
): Promise<ProviderModelsResult[]> {
  const modelPromises = activeProviders.map(async (p) => {
    try {
      const providerModels = await acpListProviderModels(p.name);
      const models = providerModels.map(
        (m) =>
          ({
            name: m.id,
            provider: p.name,
            context_limit: m.contextLimit ?? undefined,
            reasoning: getModelReasoning(p.name, m.id, m.reasoning),
          }) as Model
      );
      return { provider: p, models, error: null, warning: null };
    } catch (e: unknown) {
      // For custom providers, fall back to the configured model list
      if (p.provider_type === 'Custom') {
        const fallbackModels = p.metadata.known_models.map(
          (m) =>
            ({
              name: m.name,
              provider: p.name,
              context_limit: m.context_limit,
              reasoning: getModelReasoning(p.name, m.name, m.reasoning),
            }) as Model
        );
        if (fallbackModels.length > 0) {
          console.warn(`Failed to fetch models for ${p.name}:`, getErrorMessage(e));
          return {
            provider: p,
            models: fallbackModels,
            error: null,
            warning: `Could not fetch models from provider — showing configured models instead.`,
          };
        }
      }

      const errMsg = getErrorMessage(e);
      const errorMessage = `Failed to fetch models for ${p.name}${errMsg ? `: ${errMsg}` : ''}`;
      return {
        provider: p,
        models: null,
        error: errorMessage,
        warning: null,
      };
    }
  });

  return await Promise.all(modelPromises);
}

export async function fetchModelReasoning(
  provider: string,
  model: string,
  fallback?: boolean
): Promise<boolean | null> {
  try {
    const models = await acpListProviderModels(provider);
    const match = models.find((m) => m.id === model);
    return getModelReasoning(provider, model, match?.reasoning ?? fallback);
  } catch {
    return getModelReasoning(provider, model, fallback);
  }
}
