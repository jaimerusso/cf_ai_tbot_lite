import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { mapDOName } from '../../durable-objects/mapDO';
//TODO: Finish and test
export class IngestWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Ingest Workflow...');
		const { document } = event.payload;

		//Step 1: Generate vector embedding for the text
		console.log('Step 1: Generate vector embedding for the text');
		const embedding = await step.do(`generate-embedding`, async () => {
			const result = (await env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: document,
			})) as any;
			const values = result.data?.[0] as number[];
			if (!values) throw new Error('Failed to generate vector embedding');
			return values;
		});

		//Step 2: Insert the embedding and text into the vector database
		console.log('Step 2: Insert the embedding and text into the vector database');
		const id = await step.do(`insert-vector`, async () => {
			const id = crypto.randomUUID();
			env.VECTORIZE.insert([
				{
					id,
					values: embedding,
					metadata: { document }, //TODO: change for document content
				},
			]);
			return id;
		});

		//Step 3: Generate document resumee
		//If is chunked, get the current resumee and update it
		//OR
		//Generate resumee inputting the document in a model

		const mapStub = env.MAP.getByName(mapDOName);

		//Step 4: Store the id in the mapping
		console.log('Step 4: Store the id in the mapping');
		await step.do(`add-mapping`, async () => {
			mapStub.newMapping(document as string, [id], 'resumee');
		});

		//returns document id (name)
		console.log('Ingest workflow completed\ndocumentId: ', document, '\n\n');
		return document;
	}
}
