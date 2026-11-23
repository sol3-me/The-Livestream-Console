import type { FakeScenario } from '../scenario';
import apiError from './api-error.json';
import empty from './empty.json';
import mixed from './mixed.json';
import oneLive from './one-live.json';
import upcomingOnly from './upcoming-only.json';

export const SCENARIO_NAMES = ['mixed', 'empty', 'one-live', 'upcoming-only', 'api-error'] as const;
export type ScenarioName = (typeof SCENARIO_NAMES)[number];
export const DEFAULT_SCENARIO: ScenarioName = 'mixed';

export const SCENARIOS: Record<ScenarioName, FakeScenario> = {
  mixed: mixed as FakeScenario,
  empty: empty as FakeScenario,
  'one-live': oneLive as FakeScenario,
  'upcoming-only': upcomingOnly as FakeScenario,
  'api-error': apiError as FakeScenario,
};

export function isScenarioName(name: unknown): name is ScenarioName {
  return (SCENARIO_NAMES as readonly unknown[]).includes(name);
}
