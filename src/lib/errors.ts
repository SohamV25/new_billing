/**
 * Domain error used by the service layer to signal expected business-rule
 * failures (e.g. "stock cannot become negative"). Route handlers translate
 * these into consistent API responses via `fromError`.
 */
export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "DomainError";
  }
}
