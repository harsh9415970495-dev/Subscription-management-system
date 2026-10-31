import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from './domain.error';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected internal error occurred.';
    let code = 'INTERNAL_ERROR';
    let validationErrors: unknown = undefined;

    if (exception instanceof DomainError) {
      status = exception.status;
      title = exception.name;
      detail = exception.message;
      code = exception.code;
      validationErrors = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      title = exception.name;

      if (typeof res === 'string') {
        detail = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        detail = (obj.message as string) || exception.message;
        code = (obj.error as string) || code;
        if (Array.isArray(obj.message)) {
          validationErrors = obj.message;
          detail = 'One or more request validation errors occurred.';
        }
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    const problemDetails: Record<string, unknown> = {
      type: `https://brightloop.local/errors/${code.toLowerCase()}`,
      title,
      status,
      detail,
      instance: request.url,
      code,
    };

    if (validationErrors) {
      problemDetails.errors = validationErrors;
    }

    response
      .status(status)
      .contentType('application/problem+json')
      .json(problemDetails);
  }
}
