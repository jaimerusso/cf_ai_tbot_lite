import { env } from 'cloudflare:workers';
import { pollWorkflow } from '../../common/pollWorkflow';
import { toolDescriptionsDOName } from '../../durable-objects/toolDescriptionsDO';

export const searchDocumentsQueryDescription = `Search the knowledge base for information. Call this for any question that could plausibly relate to the knowledge base topics.

The "query" argument must be a normalized, keyword-focused search query optimized for vector similarity search.
- Remove personal pronouns, possessives, and filler words.
- Expand specific named instances (brands, people, places) to their general category.
- Keep it short and semantically rich.

Examples:
"what color is my VW?" → query: "car color"
"how many seats does my BMW have?" → query: "car seats"
"does my grandma's Toyota have airbags?" → query: "car airbags"
"what does my doctor do?" → query: "doctor role"
"how big is the country my friend moved to?" → query: "country size"
"how does the phone my sister bought work?" → query: "smartphone features"
"is the food my mom cooks healthy?" → query: "food nutrition"
"what does my dog eat?" → query: "dog diet"
"is the investment my uncle made a good idea?" → query: "investment strategy"`;

export const tools = async () => {
	const toolDescriptionsStub = env.TOOL_DESCRIPTIONS.getByName(toolDescriptionsDOName);
	const searchDocumentsDescription = (await toolDescriptionsStub.getToolDescription()) || 'Never call this tool!';
	return [
		{
			name: 'searchDocuments',
			description: searchDocumentsDescription,
			parameters: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description: searchDocumentsQueryDescription,
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
};

export const searchDocuments = async (args: { query: string }): Promise<string> => {
	const { query } = args;
	const instance = await env.SEARCH_WORKFLOW.create({
		params: { query },
	});

	const result = await pollWorkflow<string>(instance);

	return result;
};
