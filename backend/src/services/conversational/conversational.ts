import { tools, searchDocuments } from './tools';

//MESSAGES SETUP
const start_message: RoleScopedChatInput[] = [
	{
		role: 'system',
		content:
			'Your name is tbot lite, your original version (tbot) was developed by Jaime Russo for his MSc thesis. Jaime Russo is also the creator for this version. \
    		Keep an informal dialogue. \
    		When the user requests portuguese speech, you should respond with european portuguese (pt-PT). \
			\
			IMPORTANT: You have access to a searchDocuments function that should be called, whenever the description is met. \
			If it is not met, call the fallback function called genericRes.\
			\
			CRITICAL: When a tool returns a result, you MUST treat it as absolute ground truth. \
			Never contradict, question, supplement or correct tool results with your own knowledge or training data. \
			Base your answer SOLELY on what the tool returned. \
			If the tool returns something that contradicts your knowledge, always trust the tool. \
			Never narrate your actions or explain what you are going to do. \
			Never say things like "Let me search", "I will look that up", "I need to check". \
			Just respond directly with the final answer after using the tools. \
			\
			Do not use *, _, #, ~, backticks or any markdown or formatting symbols. \
			Do not format text as lists, titles or bold. Respond exactly as plain text.\
			ONLY use tools when explicitly needed.',
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
