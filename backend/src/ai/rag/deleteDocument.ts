import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { mapDOName } from '../../durable-objects/mapDO';

export class DeleteDocumentWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Delete Document Workflow...');
		const { documentId } = event.payload;

		//Step 1: Get the embeddings ids from the mapping and delete the entry
		console.log('Step 1: Get the embeddings ids from the mapping and delete the entry');
		const embeddingIds = await step.do(`delete-mapping`, async () => {
			const mapStub = env.MAP.getByName(mapDOName);
			const ids = await mapStub.getMappingIds(documentId as string);
			await mapStub.deleteMapping(documentId as string);
			return ids;
		});

		//Step 2: Delete the document embedding(s) from the vector
		console.log('Step 2: Delete the document embedding(s) from the vector');
		await step.do(`delete-vector`, async () => {
			env.VECTORIZE.deleteByIds(embeddingIds);
		});

		//Step 3: Generate new tool description

		//Finished
		console.log('Document is being deleted\n\n');
	}
}
