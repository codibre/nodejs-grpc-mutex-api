import {
	AcquireRequest,
	AcquireResponse,
	ReleaseRequest,
	ReleaseResponse,
} from '../models';
import { getTimeoutError, timeoutSymbol, waitForTimeout } from '../utils';
import { v4 as uuidV4 } from 'uuid';
import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';

const DEFAULT_WAIT_TIMEOUT = 15000;
const DEFAULT_MUTEX_TIMEOUT = 300000;
const lockers = new Map<string, Promise<unknown>>();
const releasers = new Map<string, () => void>();

export const mutexController = {
	async acquire(
		call: ServerUnaryCall<AcquireRequest, AcquireResponse>,
		callback: sendUnaryData<AcquireResponse>,
	): Promise<void> {
    try {
      const { id, waitTimeout, mutexTimeout } = call.request;
      const lockPromise = lockers.get(id);
      if (lockPromise) {
        const promiseResult = await Promise.race([
          lockPromise,
          waitForTimeout(waitTimeout || DEFAULT_WAIT_TIMEOUT),
        ]);
        if (promiseResult === timeoutSymbol) {
          callback(getTimeoutError());
          return;
        }
      }
      const returnId = uuidV4();
      const result = { id: returnId };
      const promise = new Promise<void>(async (resolve) => {
        releasers.set(returnId, resolve);
        await waitForTimeout(mutexTimeout || DEFAULT_MUTEX_TIMEOUT);
        releasers.get(returnId)?.();
      }).then(() => {
        releasers.delete(returnId);
        lockers.delete(id);
      });

      lockers.set(id, promise);

      callback(null, result);
    } catch (err) {
      callback(err as Error);
    }
	},

	release(
		call: ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
		callback: sendUnaryData<ReleaseResponse>,
	): void {
    try {
      const { id } = call.request;

      releasers.get(id)?.();

      callback(null, {});
    } catch (err) {
      callback(err as Error);
    }
	},
};
