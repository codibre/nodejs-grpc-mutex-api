import { ServerUnaryCall, sendUnaryData } from '@grpc/grpc-js';

export interface AcquireRequest {
	id: string;
	waitTimeout?: number;
	mutexTimeout?: number;
}

export interface AcquireResponse {
	id: string;
}

export interface ReleaseRequest {
	id: string;
}

export interface ReleaseResponse {}

export interface MutexService {
	acquire(
		call: ServerUnaryCall<AcquireRequest, AcquireResponse>,
		callback: sendUnaryData<AcquireResponse>,
	): Promise<void>;
	release(
		call: ServerUnaryCall<ReleaseRequest, ReleaseResponse>,
		callback: sendUnaryData<ReleaseResponse>,
	): void;
}
