import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
//TODO: Finish and test
export class IngestWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Ingest Workflow...');
		const { text } = event.payload;

		//Step 1: Generate vector embedding for the text
		const embedding = await step.do(`generate-embedding`, async () => {
			const result = (await env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text,
			})) as any;
			const values = result.data?.[0] as number[];
			if (!values) throw new Error('Failed to generate vector embedding');
			return values;
		});
		console.log('Generated embedding:', embedding);

		return 'All cars are black.';
	}
}
