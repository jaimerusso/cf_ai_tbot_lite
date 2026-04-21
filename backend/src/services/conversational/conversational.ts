import { intent_instructions, resumee_instructions, truth_instructions } from './instructions';
import { tools, searchDocuments } from './tools';

function appendMessage(messages: RoleScopedChatInput[], role: string, content: string): RoleScopedChatInput[] {
	messages.push({
		role,
		content,
	});
	return messages;
}

//Generate a title for the dialogue from the first user prompt
export async function generateResumee(env: Env, prompt: string): Promise<string> {
	const instructions = resumee_instructions(prompt);

	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: instructions })) as { response: string };
	return response.response;
}

//Get the intent of the user and return the tool to call (or fallback - generic) and the arguments to call it (or the original prompt)
async function getIntent(env: Env, messages: RoleScopedChatInput[]): Promise<[string, string]> {
	const instructions = intent_instructions(messages);
	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: instructions, tools })) as any;

	const toolCalls = response.tool_calls;

	//Check if tool_calls is empty and return default response if it is
	if (!toolCalls || toolCalls.length === 0) {
		return ['generic', ''];
	}

	const tool = toolCalls[0];

	switch (tool.name) {
		case 'searchDocuments':
			return [tool.name, tool.arguments.query];
		default:
			return [tool.name, ''];
	}
}

//TODO: TER UMA MENSAGEM DE SISTEMA DIFERENTE PARA CADA TIPO DE INTERAÇÂO (GET INTENT, ANSWER, ETC ETC ETC)?
export async function getAnswer(env: Env, prompt: string, messages: RoleScopedChatInput[]): Promise<[RoleScopedChatInput[], string]> {
	//Append prompt to messages
	messages = appendMessage(messages, 'user', prompt);

	let [toolName, toolArgs] = await getIntent(env, messages);

	console.log('toolName: ', toolName);
	console.log('toolArgs: ', toolArgs);

	//Check if it detected searchDocuments toolcall
	if (toolName === 'searchDocuments') {
		//TODO: RAG Pipeline - get the relevant information from the documents.
		let searchResult = searchDocuments({ query: toolArgs });
		console.log(searchResult);

		//TODO: Assign new system prompt to answer to the prompt, based in the information retrieved from the RAG Pipeline
		messages = appendMessage(messages, 'tool', searchResult);
		messages = truth_instructions(messages);
		console.log('DIALOGUE: ', messages);
	}

	const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;

	console.log('Final response: ', response);

	let finalRes = response.response;
	//Append response to messages and return both
	messages = appendMessage(messages, 'assistant', finalRes);
	return [messages, finalRes];
}
