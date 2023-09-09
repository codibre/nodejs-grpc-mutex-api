import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './module';
import { join } from 'path';

export async function main() {
	const app = await NestFactory.createMicroservice<MicroserviceOptions>(
		AppModule,
		{
			transport: Transport.GRPC,
			options: {
				package: 'codibre.Mutex',
				protoPath: join(process.cwd(), 'proto/mutex.proto'),
				url: 'localhost:3000',
			},
		},
	);

	await app.listen();
}
