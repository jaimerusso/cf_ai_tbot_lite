import { DurableObject } from 'cloudflare:workers';
import type { ChatParams } from '../ai/conversational/conversational';
import { dialoguesDOName } from './dialoguesDO';
import { pollWorkflow } from '../common/workflow';

export const chatRoomDOName = 'chat';

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
		console.log(message);
		if (typeof message === 'string') {
			const { dialogueId, prompt } = JSON.parse(message);

			const params: ChatParams = {
				dialogueId: dialogueId,
				prompt: prompt,
				dialoguesDOName: dialoguesDOName,
			};

			const instance = await this.env.CHAT_WORKFLOW.create({
				params,
			});

			const result = await pollWorkflow(instance, ['finalResponse', 'title']);

			//Send the response back to the client and the title if it exists
			result.title
				? ws.send(JSON.stringify({ title: result.title, response: result.finalResponse }))
				: ws.send(JSON.stringify({ response: result.finalResponse }));
		} else {
			ws.send('Invalid message type. Message must be a string!');
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		// With web_socket_auto_reply_to_close (compat date >= 2026-04-07), the runtime
		// auto-replies to Close frames. Calling close() is safe but no longer required.
		ws.close(code, reason);
	}
}
