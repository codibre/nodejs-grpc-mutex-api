import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
	AcquireRequest,
	AcquireResponse,
	ReleaseRequest,
	ReleaseResponse,
} from '../models';
import { getTimeoutError, timeoutSymbol, waitForTimeout } from '../utils';
import { v4 as uuidV4 } from 'uuid';

const DEFAULT_WAIT_TIMEOUT = 15000;
const DEFAULT_MUTEX_TIMEOUT = 300000;
@Controller()
export class MutexController {
	private lockers = new Map<string, Promise<unknown>>();
	private releasers = new Map<string, () => void>();

	@GrpcMethod('MutexService', 'acquire')
	async acquire(data: AcquireRequest): Promise<AcquireResponse> {
		const { id, waitTimeout, mutexTimeout } = data;
		const promiseResult = await Promise.race([
			this.lockers.get(id),
			waitForTimeout(waitTimeout || DEFAULT_WAIT_TIMEOUT),
		]);
		if (promiseResult === timeoutSymbol) {
			throw getTimeoutError();
		}
		const returnId = uuidV4();
		const result = { id: returnId };
		const promise = new Promise<void>(async (resolve) => {
			this.releasers.set(returnId, resolve);
			await waitForTimeout(mutexTimeout || DEFAULT_MUTEX_TIMEOUT);
			this.release(result);
		}).then(() => {
			this.releasers.delete(returnId);
			this.lockers.delete(id);
		});

		this.lockers.set(id, promise);

		return result;
	}

	@GrpcMethod('MutexService', 'release')
	release(data: ReleaseRequest): ReleaseResponse {
		const { id } = data;

		this.releasers.get(id)?.();

		return {};
	}
}
