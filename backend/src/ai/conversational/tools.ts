import { env } from 'cloudflare:workers';
import { pollWorkflow } from '../../common/pollWorkflow';
import { toolDescriptionsDOName } from '../../durable-objects/toolDescriptionsDO';

export const searchDocumentsQueryDescription = `
The "query" argument must be a clean, semantically rich phrase optimized for vector similarity search.

Rules for building the query:
- Remove all personal pronouns, possessives, filler words, and conversational fluff (I, my, your, the, a, does, is, what, how, etc.).
- Never include proper names of specific people, pets, brands, or places — replace them with their general category.
- Never include the user's opinion, emotion, or tone — extract only the factual subject.
- If the question is compound, extract the most specific and informative part.
- Keep the query between 2 and 6 words. Shorter is better if it preserves meaning.
- Use nouns and adjectives only. Avoid verbs unless essential to meaning.
- Always write the query in English, regardless of the language the user is writing in.

Examples:
"what color is my VW?" → query: "car color"
"how many seats does my BMW have?" → query: "car seats capacity"
"does my grandma's Toyota have airbags?" → query: "car airbags safety"
"what does my doctor do?" → query: "doctor role responsibilities"
"how big is the country my friend moved to?" → query: "country size area"
"mi perro ama el chocolate, que guay!" → query: "dogs and chocolate"
"is the food my mom cooks healthy?" → query: "food nutrition health"
"o meu cão pode comer uvas?" → query: "dogs eating grapes"
"que investimentos devo fazer?" → query: "investment strategy"
"can Belinha eat chocolate?" → query: "dogs chocolate diet"`;

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
			description:
				'Call this for general knowledge questions that are NOT about the specific topics in the knowledge base. This includes world events, sports results, history, science, geography, celebrities, news, cooking, travel, and any broad factual question. If the topic is not something a private document collection would contain, call this tool. When in doubt, call this.',
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
