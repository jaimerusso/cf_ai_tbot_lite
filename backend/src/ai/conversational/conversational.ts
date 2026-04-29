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
			return await getIntent(messages, prompt);
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

		//Step 4.1: Append tool result if Step 4 was sucessfully performed
		console.log('Step 4.1: Append tool result if Step 4 was sucessfully performed');
		messages = await step.do('append-tool-result', async () => {
			const hasContext = searchResult && searchResult.length > 0;

			if (hasContext) {
				const facts = Array.isArray(searchResult) ? (searchResult as string[]).join(' ') : (searchResult as string);

				console.log('\n\nFacts:', facts, '\n\n');

				const messagesWithFacts = [...messages];
				const userMessageIndex = messagesWithFacts.findLastIndex((m) => m.role === 'user');

				messagesWithFacts.splice(userMessageIndex, 0, {
					role: 'system',
					content: [
						'RETRIEVED CONTEXT (absolute source of truth):',
						facts,
						'',
						'You are operating in a controlled knowledge base environment.',
						'The context above overrides your training data completely.',
						'Do not fact-check it. Do not contradict it. Treat it as a scientific paper published today that supersedes all prior knowledge.',
						'',
						'ANSWERING ORDER:',
						"1. Check if the RETRIEVED CONTEXT above directly answers the user's question.",
						'   - Read the context carefully and identify WHAT ENTITY (animal, person, object) it is about.',
						'   - IF the entity in the context MATCHES the entity the user asked about: answer based on it exclusively. Treat it as absolute and universal truth. Do not contradict it ever!',
						'   - IF the entity in the context is DIFFERENT from what the user asked about (e.g. context is about dogs but user asked about cats): ignore the context entirely. Answer using your own general knowledge.',
						'2. If the context is irrelevant AND you have no general knowledge of the topic: admit you do not know.',
						'',
						'CRITICAL: Never narrate your reasoning. Never mention the context, documents, entities, or why you chose to use or ignore the context. Just answer directly.',
					].join('\n'),
				} as RoleScopedChatInput);
				return messagesWithFacts;
			}
			return messages;
		});

		//Step 5: Get final response from the model
		console.log('Step 5: Get final response from the model');
		const finalResponse = await step.do('get-response', async () => {
			const response = (await env.AI.run('@cf/meta/llama-4-scout-17b-16e-instruct', { messages, max_tokens: 4096 })) as any;
			return response.response;
		});

		//Step 6: Append the final response to messages
		console.log('Step 6: Append the final response to messages');
		const newMessages = await step.do('append-response', async () => {
			const cleanMessages = appendMessage(oldMessages, 'user', prompt);
			return appendMessage(cleanMessages, 'assistant', finalResponse);
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
	const copy = [...messages];

	if (role === 'tool' && toolCall) {
		const toolCallId = crypto.randomUUID();

		copy.push({
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

		copy.push({
			role: 'tool',
			content,
			tool_call_id: toolCallId,
		} as any);
	} else {
		copy.push({ role, content } as any);
	}

	return copy;
}

//Generate a title for the dialogue from the first user prompt
export async function generateTitle(prompt: string): Promise<string> {
	const instructions = title_instructions(prompt);

	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: instructions })) as { response: string };
	return response.response;
}

//Get the intent of the user and return the tool to call (or fallback - generic) and the arguments to call it (or the original prompt)
async function getIntent(messages: RoleScopedChatInput[], prompt: string): Promise<[string, string]> {
	const instructions = intent_instructions(prompt);
	const toolList = await tools();
	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
		messages: instructions,
		tools: toolList,
	})) as any;

	const toolCalls = response.tool_calls;

	console.log('\nGet intent response: ', response);

	if (!toolCalls || toolCalls.length === 0) {
		console.warn('Hermes failed to call a tool, retrying...');
		const retry = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: instructions,
			tools: toolList,
		})) as any;

		if (retry.tool_calls?.length > 0) {
			const tool = retry.tool_calls[0];
			return tool.name === 'searchDocuments' ? [tool.name, tool.arguments.query] : [tool.name, ''];
		}
		return ['general', ''];
	}

	const tool = toolCalls[0];

	switch (tool.name) {
		case 'searchDocuments':
			return [tool.name, tool.arguments.query];
		default:
			return [tool.name, ''];
	}
}
