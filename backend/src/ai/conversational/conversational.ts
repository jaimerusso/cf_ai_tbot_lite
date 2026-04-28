import { intent_instructions, normalize, title_instructions } from './instructions';
import { tools, searchDocuments } from './tools';
import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import type { Dialogue } from '../../durable-objects/dialoguesDO';

export type ChatParams = { dialogueId: string; prompt: string; dialoguesDOName: string };

export class ChatWorkflow extends WorkflowEntrypoint<Env, ChatParams> {
	async run(event: WorkflowEvent<ChatParams>, step: WorkflowStep) {
		console.log('\n\nStarting Chat Workflow...');
		const { dialogueId, prompt, dialoguesDOName } = event.payload;
		const dialoguesStub = this.env.DIALOGUES.getByName(dialoguesDOName);

		//Step 1: Get the existing dialogue messages from the Durable Object
		console.log('Step 1: Get the existing dialogue messages from the Durable Object');
		const oldMessages = await step.do('get-messages', async () => {
			const res = await dialoguesStub.getDialogue(dialogueId);
			const { dialogue } = (await res.json()) as { dialogue: Dialogue };
			return dialogue.messages;
		});

		//Step 2: Append the prompt to the existing messages
		console.log('Step 2: Append the prompt to the existing messages');
		let messages = await step.do('append-prompt', async () => {
			return appendMessage(oldMessages, 'user', prompt);
		});

		//Step 3: Understand the user's intent and decide if a tool call is needed
		console.log("Step 3: Understand the user's intent and decide if a tool call is needed");
		const [toolName, toolArgs] = await step.do('get-intent', async () => {
			return await getIntent(messages);
		});
		console.log('toolCall detected: ', toolName);
		console.log('toolArgs detected: ', toolArgs);

		//Step 4: Search documents if needed
		console.log('Step 4: Search documents if needed');
		const searchResult = await step.do('search-documents', async () => {
			if (toolName === 'searchDocuments') {
				return await searchDocuments({ query: toolArgs });
			}
			return null;
		});

		console.log('\n\n Search result: ', searchResult);

		//Step 4.1: Append tool result if Step 4 was sucessfully performed
		console.log('Step 4.1: Append tool result if Step 4 was sucessfully performed');
		messages = await step.do('append-tool-result', async () => {
			if (searchResult && searchResult.length > 0) {
				const facts = Array.isArray(searchResult) ? (searchResult as string[]).join(' ') : (searchResult as string);

				// Injeta os factos como se o assistant já soubesse antes da pergunta
				const messagesWithFacts = [...messages];
				const userMessageIndex = messagesWithFacts.findLastIndex((m) => m.role === 'user');

				messagesWithFacts.splice(userMessageIndex, 0, {
					role: 'assistant',
					content: `For context: ${facts}`,
					name: 'ignore',
				} as any);

				return messagesWithFacts;
			}
			return messages;
		});

		console.log('\n\n Messages: ', messages);

		//Step 5: Get final response from the model
		console.log('Step 5: Get final response from the model');
		const finalResponse = await step.do('get-response', async () => {
			const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages, max_tokens: 2048 })) as any;
			return response.response;
		});

		//Step 6: Append the final response to messages
		console.log('Step 6: Append the final response to messages');
		const newMessages = await step.do('append-response', async () => {
			return appendMessage(messages, 'assistant', finalResponse);
		});

		//Step 7: Save the updated dialogue messages in the Durable Object and get a title if is the first interaction
		console.log('Step 7: Save the updated dialogue messages in the Durable Object and get a title if is the first interaction');
		const title = await step.do('get-messages', async () => {
			return await dialoguesStub.saveMessages(dialogueId, newMessages);
		});

		//Workflow completed
		console.log('Conversational workflow completed\nresponse: ', finalResponse, '\ntitle: ', title, '\n\n');
		return { finalResponse, title };
	}
}

//Append message to dialogue
function appendMessage(
	messages: RoleScopedChatInput[],
	role: string,
	content: string,
	toolCall?: { name: string; arguments: Record<string, string> },
): RoleScopedChatInput[] {
	if (role === 'tool' && toolCall) {
		const toolCallId = crypto.randomUUID();

		messages.push({
			role: 'assistant',
			content: '',
			tool_calls: [
				{
					id: toolCallId,
					type: 'function',
					function: {
						name: toolCall.name,
						arguments: JSON.stringify(toolCall.arguments),
					},
				},
			],
		} as any);

		messages.push({
			role: 'tool',
			content,
			tool_call_id: toolCallId,
		} as any);
	} else {
		messages.push({ role, content } as any);
	}

	return messages;
}

//Generate a title for the dialogue from the first user prompt
export async function generateTitle(prompt: string): Promise<string> {
	const instructions = title_instructions(prompt);

	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: instructions })) as { response: string };
	return response.response;
}

//Get the intent of the user and return the tool to call (or fallback - generic) and the arguments to call it (or the original prompt)
//Not too accurate
async function getIntent(messages: RoleScopedChatInput[]): Promise<[string, string]> {
	const instructions = intent_instructions(messages);
	const toolList = await tools();
	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		messages: instructions,
		tools: toolList,
	})) as any;

	const toolCalls = response.tool_calls;

	console.log('\nGet intent response: ', response);

	//Check if tool_calls is empty and return default response if it is
	// if (!toolCalls || toolCalls.length === 0) {
	// 	return ['generic', ''];
	// }
	if (!toolCalls || toolCalls.length === 0) {
		const lastUserMessage = messages.findLast((m) => m.role === 'user')?.content ?? '';
		const normalized = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: normalize(lastUserMessage),
		})) as any;

		const query = normalized.response ?? lastUserMessage;
		return ['searchDocuments', query];
	}

	const tool = toolCalls[0];

	switch (tool.name) {
		case 'searchDocuments':
			return [tool.name, tool.arguments.query];
		default:
			return [tool.name, ''];
	}
}
