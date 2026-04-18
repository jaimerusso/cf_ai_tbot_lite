import { DurableObject } from 'cloudflare:workers';
import { start_message, getAnswer, generateResumee } from './services/conversational/conversational';

type Dialogue = {
	id: string;
	title: string;
	messages: RoleScopedChatInput[];
};

const chatRoomDOName = 'chat';
const dialoguesDOName = 'dialogues';

export class Dialogues extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async newDialogue(): Promise<Response> {
		let id = crypto.randomUUID();
		const dialogue: Dialogue = {
			id,
			title: '',
			messages: start_message,
		};
		await this.ctx.storage.put(id, dialogue);
		return Response.json({ dialogue });
	}

	async getDialogueIds(): Promise<Response> {
		const entries = await this.ctx.storage.list<Dialogue>();
		const dialogues = Array.from(entries.values()).map((d) => ({ id: d.id, title: d.title }));
		return Response.json({ dialogues });
	}

	async getDialogue(dialogueId: string): Promise<Response> {
		const entry = await this.ctx.storage.get<Dialogue>(dialogueId);
		return new Response(JSON.stringify({ dialogue: entry }));
	}

	//Called from the websocket after answering a prompt
	async saveMessages(dialogueId: string, messages: RoleScopedChatInput[]): Promise<void> {
		const entry = await this.ctx.storage.get<Dialogue>(dialogueId);

		if (!entry) {
			console.log('Dialogue was not found so the messages will not be saved!');
			return;
		}

		entry.messages = messages;

		if (entry.title === '') {
			const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)?.content;
			if (typeof lastUserMessage === 'string') {
				entry.title = await generateResumee(this.env, lastUserMessage);
			}
		}

		await this.ctx.storage.put(dialogueId, entry);
		console.log('Dialogue was found, messages saved!');
	}

	async dialogueExists(dialogueId: string): Promise<boolean> {
		return (await this.ctx.storage.get<Dialogue>(dialogueId)) ? true : false;
	}
}

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

			const dialoguesStub = this.env.DIALOGUES.getByName(dialoguesDOName);

			if (await dialoguesStub.dialogueExists(dialogueId)) {
				let [messages, response] = await getAnswer(this.env, prompt);
				dialoguesStub.saveMessages(dialogueId, messages);
				ws.send(response);
			} else {
				ws.send('Invalid dialogueId!');
			}
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

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 *
	 * This handler routes to:
	 * -ChatRoom Durable Object for chat interactions via WebSockets
	 * -Dialogues Durable Object for storing/retrieving messages and dialogues.
	 */
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		const dialoguesStub = env.DIALOGUES.getByName(dialoguesDOName);

		// Get Dialogue messages
		const messagesPattern = new URLPattern({ pathname: '/dialogues/:id' });
		const messagesMatch = messagesPattern.exec(url);
		if (messagesMatch && request.method === 'GET') {
			const dialogueId = messagesMatch.pathname.groups.id;
			return dialoguesStub.getDialogue(dialogueId);
		}

		// Get Dialogues
		const dialoguesPattern = new URLPattern({ pathname: '/dialogues' });
		if (dialoguesPattern.exec(url) && request.method === 'GET') {
			return dialoguesStub.getDialogueIds();
		}

		// New Dialogue
		if (dialoguesPattern.exec(url) && request.method === 'POST') {
			return dialoguesStub.newDialogue();
		}

		// WebSocket
		if (request.headers.get('Upgrade') === 'websocket') {
			const chatStub = env.CHAT_ROOM.getByName(chatRoomDOName);
			return chatStub.fetch(request);
		}

		return new Response('Not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
