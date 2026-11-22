import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StreamCard from '@/components/StreamCard';
import StreamTableRow from '@/components/StreamTableRow';
import { formattedStream } from '../fixtures/youtube';

const noop = () => {};
const handlers = { onEdit: noop, onDelete: noop, onCopy: noop };

const renderCard = (privacyStatus: string) =>
  renderToStaticMarkup(<StreamCard stream={formattedStream({ privacyStatus })} {...handlers} />);

const renderRow = (privacyStatus: string) =>
  renderToStaticMarkup(
    <table>
      <tbody>
        <StreamTableRow stream={formattedStream({ privacyStatus })} {...handlers} />
      </tbody>
    </table>,
  );

// The badge colour for each privacy status, as the table view has always shown it.
const badgeColour: Record<string, string> = {
  public: 'bg-green-100',
  unlisted: 'bg-yellow-100',
  private: 'bg-gray-100',
};

describe('stream privacy badge', () => {
  describe.each(Object.entries(badgeColour))('%s', (status, colour) => {
    it('is shown in the table view', () => {
      const html = renderRow(status);
      expect(html).toContain(`>${status}</span>`);
      expect(html).toContain(colour);
    });

    // Issue #51: the card view showed no privacy status at all.
    it('is shown in the card view, styled as in the table view', () => {
      const html = renderCard(status);
      expect(html).toContain(`>${status}</span>`);
      expect(html).toContain(colour);
    });
  });
});
