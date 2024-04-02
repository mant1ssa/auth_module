"use strict";

const { ServiceBroker } = require("moleculer");
const { ValidationError } = require("moleculer").Errors;
const TestService = require("../../../services/greeter.service");

describe("Test 'reg' service", () => {
	let broker = new ServiceBroker({ logger: false });
	broker.createService(TestService);

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	describe("Test 'auth.registrer' action", () => {

		it("В базе должен появится пользователь", async () => {
			const res = await broker.call("user.register");
			expect(res).toBe("Успешно добавлен пользователь");
		});

	});

	describe("Test 'login' service", () => {
        let broker = new ServiceBroker({ logger: false });
        broker.createService(TestService);
    
        beforeAll(() => broker.start());
        afterAll(() => broker.stop());
    
        describe("Test 'auth.login' action", () => {
    
            it("В базе должен появится пользователь", async () => {
                const res = await broker.call("user.login");
                expect(res).toBe("Вы успешно вошли под именем: ${isUserVerified.rows[0].surname}");
            });
    
        });

});
})
