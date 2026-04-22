import { DurableObject } from 'cloudflare:workers';
import { generateResumee } from './ai/conversational/conversational';
import { chat_instructions } from './ai/conversational/instructions';
import type { Dialogue, ChatParams } from './ai/conversational/conversational';
export { ChatWorkflow } from './ai/conversational/conversational';
export { SearchWorkflow } from './ai/rag/search';
export { IngestWorkflow } from './ai/rag/ingest';

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
			title: 'New chat',
			messages: structuredClone(chat_instructions),
			lastUpdate: Date.now(),
		};
		await this.ctx.storage.put(id, dialogue);
		return Response.json({ dialogue });
	}

	async getDialogueIds(): Promise<Response> {
		const entries = await this.ctx.storage.list<Dialogue>();
		//Sort in descending order by creationDate, so that the most recent dialogue appears first
		const dialogues = Array.from(entries.values())
			.sort((a, b) => b.lastUpdate - a.lastUpdate)
			.map((d) => ({ id: d.id, title: d.title }));
		return Response.json({ dialogues });
	}

	async getDialogue(dialogueId: string): Promise<Response> {
		const entry = await this.ctx.storage.get<Dialogue>(dialogueId);
		return new Response(JSON.stringify({ dialogue: entry }));
	}

	async deleteDialogue(dialogueId: string): Promise<Response> {
		await this.ctx.storage.delete(dialogueId);
		return new Response(JSON.stringify({ dialogueId }));
	}

	//Called from the websocket after answering a prompt
	async saveMessages(dialogueId: string, messages: RoleScopedChatInput[]): Promise<string> {
		const entry = await this.ctx.storage.get<Dialogue>(dialogueId);

		if (!entry) {
			console.log('Dialogue was not found so the messages will not be saved!');
			return '';
		}

		entry.messages = messages;

		let titleChanged = false;
		if (entry.title === 'New chat') {
			const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)?.content;
			if (typeof lastUserMessage === 'string') {
				entry.title = await generateResumee(lastUserMessage);
			}
			titleChanged = true;
		}

		entry.lastUpdate = Date.now();

		await this.ctx.storage.put(dialogueId, entry);
		console.log('Dialogue was found, messages saved!');
		return titleChanged ? entry.title : '';
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

			const params: ChatParams = {
				dialogueId: dialogueId,
				prompt: prompt,
				dialoguesDOName: dialoguesDOName,
			};

			const instance = await this.env.CHAT_WORKFLOW.create({
				params,
			});

			//Wait for "complete" status and get the result
			let response: string = '';
			let title: string = '';
			while (true) {
				const status = await instance.status();
				if (status.status === 'complete') {
					const output = status.output as { finalResponse: string; title: string };
					response = output.finalResponse;
					title = output.title;
					break;
				} else if (status.status === 'errored') {
					throw new Error('Workflow failed');
				}
				await new Promise((r) => setTimeout(r, 500)); //Wait for 500ms before checking the status again
			}
			//Send the response back to the client and the title if it exists
			title ? ws.send(JSON.stringify({ title, response })) : ws.send(JSON.stringify({ response }));
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

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	const dialoguesStub = env.DIALOGUES.getByName(dialoguesDOName);

	const messagesPattern = new URLPattern({ pathname: '/dialogues/:id' });
	const messagesMatch = messagesPattern.exec(url);
	if (messagesMatch && request.method === 'GET') {
		const dialogueId = messagesMatch.pathname.groups.id;
		return dialoguesStub.getDialogue(dialogueId);
	}

	if (messagesMatch && request.method === 'DELETE') {
		const dialogueId = messagesMatch.pathname.groups.id;
		return dialoguesStub.deleteDialogue(dialogueId);
	}

	const dialoguesPattern = new URLPattern({ pathname: '/dialogues' });
	if (dialoguesPattern.exec(url) && request.method === 'GET') {
		return dialoguesStub.getDialogueIds();
	}
	if (dialoguesPattern.exec(url) && request.method === 'POST') {
		return dialoguesStub.newDialogue();
	}

	if (request.headers.get('Upgrade') === 'websocket') {
		const chatStub = env.CHAT_ROOM.getByName(chatRoomDOName);
		return chatStub.fetch(request);
	}

	return new Response('Not found', { status: 404 });
}

export default {
	/**
	 * This handler routes to:
	 * -ChatRoom Durable Object for chat interactions via WebSockets
	 * -Dialogues Durable Object for storing/retrieving messages and dialogues.
	 */
	async fetch(request, env, ctx): Promise<Response> {
		const response = await handleRequest(request, env, ctx);

		if (request.headers.get('Upgrade') === 'websocket') {
			return response;
		}

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		//Put all corsHeaders as headers for the response
		const newResponse = new Response(response.body, response);
		Object.entries(corsHeaders).forEach(([key, value]) => {
			newResponse.headers.set(key, value);
		});
		return newResponse;
	},
} satisfies ExportedHandler<Env>;
