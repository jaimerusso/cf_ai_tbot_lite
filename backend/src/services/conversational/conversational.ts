import { tools, searchDocuments } from './tools';

//MESSAGES SETUP
const start_message: RoleScopedChatInput[] = [
	{
		role: 'system',
		content: `You are tbot lite, a conversational assistant created by Jaime Russo. Your original version (tbot) was developed for his MSc thesis. This version is a tailored adaptation built for Jaime Russo's application to the Cloudflare Software Engineering Summer Internship (Summer 2026).

		PERSONALITY:
		- Keep a casual and informal tone.
		- If the user writes in Portuguese, always respond in European Portuguese (pt-PT).

		TOOLS:
		- You have access to two functions: searchDocuments and genericRes.
		- Call searchDocuments when the user asks something that matches its description.
		- Call genericRes for everything else. It is your fallback and must always be called if searchDocuments is not applicable.
		- Never skip calling a tool. Always call one of the two.

		TOOL RESULTS:
		- Tool results are absolute ground truth. Never question, contradict, or supplement them with your own knowledge.
		- If a tool result contradicts what you know, always trust the tool result.
		- Base your response solely on what the tool returned.

		RESPONSE STYLE:
		- Never narrate your actions. Never say things like "Let me search that", "I will look that up" or "I need to check".
		- Respond directly with the final answer.
		- Do not use any markdown or formatting symbols such as *, _, #, ~, or backticks.
		- Do not use lists, titles, or bold text.
		- Always respond in plain text only.`,
	},
];

function appendMessage(messages: RoleScopedChatInput[], role: string, content: string): RoleScopedChatInput[] {
	messages.push({
		role,
		content,
	});
	return messages;
}

//Get the intent of the user and return the tool to call (or fallback - generic) and the arguments to call it (or the original prompt)
async function getIntent(env: Env, prompt: string, messages: RoleScopedChatInput[]): Promise<[string, string]> {
	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages, tools })) as any;

	const tool = response.tool_calls[0];

	switch (tool.name) {
		case 'searchDocuments':
			return [tool.name, tool.arguments.query];
		default:
			return [tool.name, prompt];
	}
}

export async function getAnswer(env: Env, prompt: string, messages = start_message): Promise<[RoleScopedChatInput[], string]> {
	//Append prompt to messages
	messages = appendMessage(messages, 'user', prompt);

	let [toolName, toolArgs] = await getIntent(env, prompt, messages);

	console.log('toolName: ', toolName);
	console.log('toolArgs: ', toolArgs);

	//Check if it detected searchDocuments toolcall
	if (toolName === 'searchDocuments') {
		//TODO: RAG Pipeline - get the relevant information from the documents.
		let searchResult = searchDocuments({ query: toolArgs });
		console.log(searchResult);
		//TODO: Assign new system prompt to answer to the prompt, based in the information retrieved from the RAG Pipeline
		messages = appendMessage(messages, 'tool', searchResult);
		messages = appendMessage(
			messages,
			'user',
			'Using ONLY the information provided by the tool above, rephrase it in a natural and conversational way. Do not add, remove or contradict any information, unless it is related.',
		);
	}

	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;

	let finalRes = response.response;
	//Append response to messages and return both
	messages = appendMessage(messages, 'assistant', finalRes);
	return [messages, finalRes];
}
