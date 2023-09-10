import { promisify } from 'util';
import {
	Server,
	ServerCredentials,
	ServiceDefinition,
	loadPackageDefinition,
} from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';
import { mutexController } from './controllers';
import { MutexService } from './models';

export async function main() {
	const proto = loadSync(join(process.cwd(), '/proto/mutex.proto'));
	const definition = loadPackageDefinition(proto);
	const app = new Server();
	app.addService(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
		(definition as any).codibre.Mutex.MutexService
			.service as ServiceDefinition<MutexService>,
		mutexController,
	);

	const result = await promisify(app.bindAsync.bind(app))(
		'0.0.0.0:3000',
		ServerCredentials.createInsecure(),
	);
	app.start();
	console.log('Listening ', result);
}
