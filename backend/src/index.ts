import { DurableObject } from 'cloudflare:workers';
import { getAnswer } from './services/conversational/conversational';

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}

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

		if (request.headers.get('Upgrade') === 'websocket') {
			const stub = env.CHAT_ROOM.getByName('default-room');
			return stub.fetch(request);
		}

		// if (url.pathname === '/test') {
		// 	return new Response('Test endpoint is working!');
		// 	//const stub = env.MY_DURABLE_OBJECT.getByName('foo');
		// 	//const greeting = await stub.sayHello('world');
		// 	//return new Response(greeting);
		// }

		return new Response('Not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

// Durable Object: manages WebSocket connections with hibernation
export class ChatRoom extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		// Auto ping/pong without waking the object
		this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
	}

	async fetch(request: Request): Promise<Response> {
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		// ✅ Good: acceptWebSocket enables hibernation
		this.ctx.acceptWebSocket(server);

		return new Response(null, { status: 101, webSocket: client });
	}

	// Called when a message arrives — the object wakes from hibernation if needed
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		if (typeof message === 'string') {
			console.log(message);
			let [messages, response] = await getAnswer(this.env, message);
			ws.send(response);
		} else {
			ws.send('Invalid message type. Message must be a string!');
		}

		//Save messages in the Durable Object (for the future context of the conversation)
		//...
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		// With web_socket_auto_reply_to_close (compat date >= 2026-04-07), the runtime
		// auto-replies to Close frames. Calling close() is safe but no longer required.
		ws.close(code, reason);
	}
}
