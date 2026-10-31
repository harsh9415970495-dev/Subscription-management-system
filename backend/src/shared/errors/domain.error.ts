export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID '${id}' was not found.`, 'RESOURCE_NOT_FOUND', 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, code = 'CONFLICT_ERROR') {
    super(message, code, 409);
  }
}

export class UnauthorizedDomainError extends DomainError {
  constructor(message = 'Unauthorized action') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenDomainError extends DomainError {
  constructor(message = 'Forbidden action') {
    super(message, 'FORBIDDEN', 403);
  }
}
