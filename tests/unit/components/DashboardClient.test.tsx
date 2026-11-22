import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import DashboardClient from '@/components/DashboardClient';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const render = () =>
  renderToStaticMarkup(<DashboardClient activeStreams={[]} completedStreams={[]} upcomingCount={0} />);

describe('DashboardClient timeframe filter', () => {
  // Issue #50: the shortest filter is a rolling 24 hours (now - 24h), not the
  // calendar day, and "Today" also rendered as "Completed in today".
  it('labels the shortest timeframe "24 Hours", matching "7 Days" and "30 Days"', () => {
    const html = render();
    expect(html).toContain('>24 Hours<');
    expect(html).toContain('>7 Days<');
    expect(html).toContain('>30 Days<');
  });

  it('no longer offers a "Today" timeframe', () => {
    expect(render()).not.toContain('>Today<');
  });
});
