import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
//TODO: Finish and test
export class IngestWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Ingest Workflow...');
		const { document } = event.payload;

		//Step 1: Generate vector embedding for the text
		const embedding = await step.do(`generate-embedding`, async () => {
			const result = (await env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: document,
			})) as any;
			const values = result.data?.[0] as number[];
			if (!values) throw new Error('Failed to generate vector embedding');
			return values;
		});
		console.log('Generated embedding:', embedding);

		//Step 2: Insert the embedding and text into the vector database
		const id = await step.do(`insert-vector`, async () => {
			const id = crypto.randomUUID();
			env.VECTORIZE.insert([
				{
					id,
					values: embedding,
					metadata: { document },
				},
			]);
			return id;
		});

		return 'All cars are black.';
	}
}
