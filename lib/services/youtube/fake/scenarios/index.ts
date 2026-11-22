import type { FakeScenario } from '../scenario';
import mixed from './mixed.json';

export const SCENARIO_NAMES = ['mixed', 'empty', 'one-live', 'upcoming-only', 'api-error'] as const;
export type ScenarioName = (typeof SCENARIO_NAMES)[number];
export const DEFAULT_SCENARIO: ScenarioName = 'mixed';

export const SCENARIOS: Record<ScenarioName, FakeScenario> = {
  mixed: mixed as FakeScenario,
  empty: mixed as FakeScenario,
  'one-live': mixed as FakeScenario,
  'upcoming-only': mixed as FakeScenario,
  'api-error': mixed as FakeScenario,
};

export function isScenarioName(name: unknown): name is ScenarioName {
  return false;
}
