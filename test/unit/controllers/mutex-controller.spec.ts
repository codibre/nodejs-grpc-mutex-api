import { status } from '@grpc/grpc-js';
import { Test } from '@nestjs/testing';
import { MutexController } from '@root/src/controllers';
import { waitForTimeout } from '@root/src/utils';

describe(MutexController.name, () => {
	let target: MutexController;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			providers: [MutexController],
		}).compile();

		target = module.get(MutexController);
	});

	it('should acquire mutex, blocking any other request for the given id until it is released', async () => {
		const id = 'my-mutex-id';
		const secondCall = jest.fn();

		const result1 = await target.acquire({ id });
		const promiseResult2 = target.acquire({ id }).then((result) => {
			secondCall();
			return result;
		});

		await waitForTimeout(100);
		expect(secondCall).toHaveCallsLike();
		await target.release(result1);
		await waitForTimeout(1);
		expect(secondCall).toHaveCallsLike([]);
		const result2 = await promiseResult2;
		expect(result2).not.toEqual(result1);
		await target.release(result2);
	});

	it('acquired mutex should expires if mutexTimeout is reached', async () => {
		const id = 'my-mutex-id';
		const secondCall = jest.fn();

		const result1 = await target.acquire({ id, mutexTimeout: 99 });
		const promiseResult2 = target.acquire({ id }).then((result) => {
			secondCall();
			return result;
		});

		await waitForTimeout(150);
		expect(secondCall).toHaveCallsLike([]);
		const result2 = await promiseResult2;
		expect(result2).not.toEqual(result1);
		await target.release(result2);
	});

	it('acquired throw a deadline exception error when acquire waitTimeout is reached', async () => {
		const id = 'my-mutex-id';
		let thrownError: any;

		const result1 = await target.acquire({ id });
		try {
			await target.acquire({ id, waitTimeout: 100 });
		} catch (err) {
			thrownError = err;
		}

		await target.release(result1);
		expect(thrownError).toBeInstanceOf(Error);
		expect(thrownError.code).toEqual(status.DEADLINE_EXCEEDED);
	});
});
