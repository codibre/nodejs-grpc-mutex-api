import { promisify } from 'util';
import { ServerErrorResponse, status } from '@grpc/grpc-js';

const delay = promisify(setTimeout);

export const timeoutSymbol = Symbol('timeout');

export async function waitForTimeout(timeout: number) {
	await delay(timeout);
	return timeoutSymbol;
}

export function getTimeoutError() {
	const error: ServerErrorResponse = new Error('timeout');
	error.code = status.DEADLINE_EXCEEDED;
	return error;
}
