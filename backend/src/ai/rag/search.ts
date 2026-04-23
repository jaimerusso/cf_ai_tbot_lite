import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';

//TODO: Finish and test
export class SearchWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Search Workflow...');
		const { query } = event.payload;

		//Step 1: Generate vector embedding for the search query
		const embedding = await step.do(`generate-embedding`, async () => {
			const result = (await env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: query,
			})) as any;
			const values = result.data?.[0] as number[];
			if (!values) throw new Error('Failed to generate vector embedding');
			return values;
		});

		//Step 2: Search for top 3 similar vectors in the vector database
		const matches = await step.do(`search-vectors`, async () => {
			return await env.VECTORIZE.query(embedding, {
				topK: 3,
				returnValues: true,
				returnMetadata: 'all',
			});
		});

		//Step 3: Transform matches in string list
		const matchStrings = await step.do(`search-vectors`, async () => {
			return matches.matches.map((match, index) => {
				console.log(`Match ${index + 1}:`);
				console.log('ID:', match.metadata?.document);
				return match.metadata?.document;
			});
		});

		return matches;
	}
}
