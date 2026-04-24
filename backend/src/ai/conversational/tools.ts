import { env } from 'cloudflare:workers';
import { pollWorkflow } from '../../common/workflow';

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

	const result = await pollWorkflow<string>(instance);

	return result;
};
