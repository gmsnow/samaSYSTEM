import { NextResponse } from 'next/server';
import { AppError } from './errors';
import logger from './logger';

export function handleError(err: unknown, path?: string) {
  if (err instanceof AppError) {
    logger.warn(`${err.name}: ${err.message}`, { path, details: err.details });
    return NextResponse.json(
      { error: err.message, details: err.details },
      { status: err.statusCode }
    );
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  logger.error('Unhandled error', { error: message, path });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
