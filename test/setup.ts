import 'reflect-metadata';
import 'jest-callslike';

afterEach(() => {
	jest.restoreAllMocks();
	jest.clearAllMocks();
});
