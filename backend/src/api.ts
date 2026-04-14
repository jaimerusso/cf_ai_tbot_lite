
export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/dialogue" && request.method === "POST") {
			//Logic to build an answer and return to the client

			try {
				const body = await request.json() as { prompt: string };
				return new Response(body.prompt);
			} catch (error) {
				return new Response("Invalid JSON body", { status: 400 });
			}

			
			const stub = env.MY_DURABLE_OBJECT.getByName("foo");
			const greeting = await stub.sayHello("world");
			//return new Response(greeting);
		}
		if (url.pathname === "/test") {
			const stub = env.MY_DURABLE_OBJECT.getByName("foo");
			const greeting = await stub.sayHello("world");
			return new Response(greeting);
		}
		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
