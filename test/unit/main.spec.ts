import { join } from 'path';
import { ChannelCredentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { main } from '@root/src/main';
import { AcquireResponse, ReleaseResponse } from '@root/src/models';
import { waitForTimeout } from '@root/src/utils';
import { promisify } from 'util';

describe(main.name, () => {
	it('should start grpc server', async () => {
		const proto = loadSync(join(process.cwd(), '/proto/mutex.proto'));
		const id = 'my-id';

		const mainResult = await main();
		const definition: any = loadPackageDefinition(proto);
		const client = new definition.codibre.Mutex.MutexService(
			'localhost:3000',
			ChannelCredentials.createInsecure(),
			{},
		);
		await waitForTimeout(1000);
		const acquireResult: AcquireResponse = await promisify(
			client.acquire.bind(client),
		)({ id });
		const releaseResult: ReleaseResponse = await promisify(
			client.release.bind(client),
		)(acquireResult);

		expect(mainResult).toBeUndefined();
		expect(acquireResult).toEqual({ id: expect.any(String) });
		expect(releaseResult).toEqual({});
	});
});
