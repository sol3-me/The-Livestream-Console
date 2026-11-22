export interface YouTubeErrorItem {
  domain: string;
  reason: string;
  message: string;
}

/**
 * The shape googleapis rejects with for API errors: `code` is the HTTP status and
 * `errors[0]` carries the documented `reason`. Pages and routes read `code` and
 * `errors[0].message`, so the fake surfaces errors exactly like the real API.
 */
export class YouTubeApiError extends Error {
  readonly code: number;
  readonly errors: YouTubeErrorItem[];
  readonly response: { status: number; data: { error: { code: number; message: string; errors: YouTubeErrorItem[] } } };

  constructor(code: number, domain: string, reason: string, message: string) {
    super(message);
    this.name = 'YouTubeApiError';
    this.code = code;
    this.errors = [{ domain, reason, message }];
    this.response = { status: code, data: { error: { code, message, errors: this.errors } } };
  }
}
