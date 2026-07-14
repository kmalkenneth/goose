import { describe, expect, it } from 'vitest';
import { getModelReasoning, getThinkingEffortLevels } from './modelInterface';

const SIX_STATE_EFFORTS = ['off', 'low', 'medium', 'high', 'xhigh', 'max'];

describe('six-state thinking effort policy', () => {
  it.each([
    ['chatgpt_codex', 'gpt-5.6-luna'],
    ['chatgpt_codex', 'gpt-5.6-terra'],
    ['chatgpt_codex', 'gpt-5.6-sol'],
    ['anthropic', 'claude-fable-5'],
  ])('shows all states for %s/%s when ACP reports reasoning support', (provider, model) => {
    expect(getModelReasoning(provider, model, true)).toBe(true);
    expect(getThinkingEffortLevels(provider, model, true)).toEqual(SIX_STATE_EFFORTS);
  });

  it('preserves the regular five-state levels for other reasoning models', () => {
    expect(getThinkingEffortLevels('anthropic', 'claude-sonnet-4-5', true)).toEqual([
      'off',
      'low',
      'medium',
      'high',
      'max',
    ]);
  });

  it('honors ACP reasoning denial for target models', () => {
    expect(getModelReasoning('chatgpt_codex', 'gpt-5.6-luna', false)).toBe(false);
    expect(getThinkingEffortLevels('chatgpt_codex', 'gpt-5.6-luna', false)).toBeNull();
  });

  it('does not invent effort support for ordinary models', () => {
    expect(getThinkingEffortLevels('chatgpt_codex', 'gpt-4o', false)).toBeNull();
  });
});
