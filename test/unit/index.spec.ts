import * as main from '@root/src/main';

describe('index.ts', () => {
	beforeEach(() => {
		jest.spyOn(main, 'main').mockImplementation();
	});

	afterEach(() => {
		delete require.cache[require.resolve('@root/src/index')];
	});

	it('should call bootstrap', () => {
		require('@root/src/index');

		expect(main.main).toHaveCallsLike([]);
	});
});
