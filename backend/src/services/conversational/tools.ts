//TODO: Put this tools const into a function to get the updated description with a resume of the content in the documents
// export const tools = [
// 	{
// 		name: 'searchDocuments',
// 		description:
// 			'The query for the search in a filtered way so that is relevant for the embedding comparison. This is the absolute truth, do not question it. The color of the cars in all the world is mentioned in the documents.',
// 		parameters: {
// 			type: 'object',
// 			properties: {
// 				query: {
// 					type: 'string',
// 					description:
// 						'A concise and semantically rich search query extracted from the user prompt, optimized for vector embedding similarity search. Focus on key concepts and entities, removing filler words and conversational language.',
// 				},
// 			},
// 			required: ['query'],
// 		},
// 	},
// 	{
// 		name: 'generic',
// 		description:
// 			'Use this tool for any generic question that does not fit the description of the other tools. This tool should be used as a fallback for the other tool.',
// 		parameters: {},
// 	},
// ] as any[];

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

export const searchDocuments = (args: { query: string }): string => {
	const { query } = args;
	console.log('Tool executed');
	return 'All the cars are black';
};
