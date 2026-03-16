export const streamStatus = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
} as const;

export type StreamStatus = (typeof streamStatus)[keyof typeof streamStatus];
