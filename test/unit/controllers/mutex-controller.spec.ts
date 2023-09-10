import { ServerUnaryCall, sendUnaryData, status } from '@grpc/grpc-js';
import { mutexController } from '@root/src/controllers';
import {
	AcquireRequest,
	AcquireResponse,
	ReleaseRequest,
	ReleaseResponse,
} from '@root/src/models';
import { waitForTimeout } from '@root/src/utils';

describe('mutexController', () => {
	let temp: AcquireResponse | undefined;
	const callback = jest
		.fn()
		.mockImplementation((_, b) => (temp = b)) as sendUnaryData<any>;

	it('should acquire mutex, blocking any other request for the given id until it is released', async () => {
		const id = 'my-mutex-id';
		const secondCall = jest.fn();
		const call = { request: { id } } as ServerUnaryCall<
			AcquireRequest,
			AcquireResponse
		>;

		await mutexController.acquire(call, callback);
		const result1 = temp;
		const promiseResult2 = mutexController.acquire(call, callback).then(() => {
			secondCall();
			return temp;
		});

		await waitForTimeout(100);
		expect(secondCall).toHaveCallsLike();
		mutexController.release(
			{ request: result1 } as ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
			callback,
		);
		await waitForTimeout(1);
		expect(secondCall).toHaveCallsLike([]);
		const result2 = await promiseResult2;
		expect(result2).not.toEqual(result1);
		mutexController.release(
			{ request: result1 } as ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
			callback,
		);
		mutexController.release(
			{ request: result2 } as ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
			callback,
		);
	});

	it('acquired mutex should expires if mutexTimeout is reached', async () => {
		const id = 'my-mutex-id';
		const secondCall = jest.fn();

		await mutexController.acquire(
			{ request: { id, mutexTimeout: 99 } } as ServerUnaryCall<
				AcquireRequest,
				AcquireResponse
			>,
			callback,
		);
		const result1 = temp;
		const promiseResult2 = mutexController
			.acquire(
				{ request: { id } } as ServerUnaryCall<AcquireRequest, AcquireResponse>,
				callback,
			)
			.then(() => {
				secondCall();
				return temp;
			});

		await waitForTimeout(150);
		expect(secondCall).toHaveCallsLike([]);
		const result2 = await promiseResult2;
		expect(result2).not.toEqual(result1);
		mutexController.release(
			{ request: result1 } as ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
			callback,
		);
		mutexController.release(
			{ request: result2 } as ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
			callback,
		);
	});

	it('acquired throw a deadline exception error when acquire waitTimeout is reached', async () => {
		const id = 'my-mutex-id';
		let thrownError: any;
		const callback2 = jest.fn().mockImplementation((a) => (thrownError = a));

		await mutexController.acquire(
			{ request: { id } } as ServerUnaryCall<AcquireRequest, AcquireResponse>,
			callback,
		);
		const result1 = temp;
		await mutexController.acquire(
			{ request: { id, waitTimeout: 100 } } as ServerUnaryCall<
				AcquireRequest,
				AcquireResponse
			>,
			callback2,
		);

		expect(thrownError).toBeInstanceOf(Error);
		expect(thrownError.code).toEqual(status.DEADLINE_EXCEEDED);
		mutexController.release(
			{ request: result1 } as ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
			callback,
		);
	});
});
