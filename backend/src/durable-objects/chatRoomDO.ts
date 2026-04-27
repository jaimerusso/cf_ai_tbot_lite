import { DurableObject } from 'cloudflare:workers';
import type { ChatParams } from '../ai/conversational/conversational';
import { dialoguesDOName } from './dialoguesDO';
import { pollWorkflow } from '../common/pollWorkflow';

export const chatRoomDOName = 'chat';

// Durable Object: manages WebSocket connections with hibernation
export class ChatRoom extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
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
			try {
				const { dialogueId, prompt } = JSON.parse(message);

				const params: ChatParams = {
					dialogueId: dialogueId,
					prompt: prompt,
					dialoguesDOName: dialoguesDOName,
				};

				const instance = await this.env.CHAT_WORKFLOW.create({
					params,
				});

				type WorkflowOutput = { finalResponse: string; title: string };

				const result = await pollWorkflow<WorkflowOutput, keyof WorkflowOutput>(instance, ['finalResponse', 'title']);

				//Send the response back to the client and the title if it exists
				result.title
					? ws.send(JSON.stringify({ title: result.title, response: result.finalResponse }))
					: ws.send(JSON.stringify({ response: result.finalResponse }));
			} catch (error) {
				console.error('WebSocket error:', error);
				ws.send(JSON.stringify({ error: 'Something went wrong' }));
			}
		} else {
			ws.send('Invalid message type. Message must be a string!');
		}
	}
}
