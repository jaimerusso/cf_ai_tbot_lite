import { DurableObject } from 'cloudflare:workers';
import { generateTitle } from '../ai/conversational/conversational';
import { chat_instructions } from '../ai/conversational/instructions';

export type Dialogue = {
	id: string;
	title: string;
	messages: RoleScopedChatInput[];
	lastUpdate: number;
};

export const dialoguesDOName = 'dialogues';

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
				entry.title = await generateTitle(lastUserMessage);
			}
			titleChanged = true;
		}

		entry.lastUpdate = Date.now();

		await this.ctx.storage.put(dialogueId, entry);
		console.log('Dialogue was found, messages saved!');
		return titleChanged ? entry.title : '';
	}
}
