import { env } from 'cloudflare:workers';

//TODO: Put this tools const into a function to get the updated description with a resume of the content in the documents
export const tools = [
	{
		name: 'searchDocuments',
		description:
			'Search for specific information in the knowledge base documents. MUST be called when the user asks anything related to cars or car colors.',
		parameters: {
			type: 'object',
			properties: {
				query: {
					type: 'string',
					description:
						'A concise and semantically rich search query optimized for vector embedding similarity search. Focus on key concepts, remove filler words.',
				},
			},
			required: ['query'],
		},
	},
	{
		name: 'generic',
		description: 'Call this for everything that does not match the description of searchDocuments.',
		parameters: {
			type: 'object',
			properties: {},
		},
	},
] as any[];

export const searchDocuments = async (args: { query: string }): Promise<string> => {
	const { query } = args;
	const instance = await env.SEARCH_WORKFLOW.create({
		params: { query },
	});

	let result;
	while (true) {
		const status = await instance.status();
		if (status.status === 'complete') {
			result = status.output as string;
			break;
		} else if (status.status === 'errored') {
			throw new Error('Workflow failed');
		}
		await new Promise((r) => setTimeout(r, 500)); //Wait for 500ms before checking the status again
	}
	console.log('Tool result:', result, '\n');
	return result;
};
