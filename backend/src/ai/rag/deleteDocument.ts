import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { Document, documentsDOName } from '../../durable-objects/documentsDO';
import { toolDescriptionsDOName } from '../../durable-objects/toolDescriptionsDO';

export class DeleteDocumentWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Delete Document Workflow...');
		const { name } = event.payload;

		const documentsStub = this.env.DOCUMENTS.getByName(documentsDOName);

		//Step 1: Update the document status to deleting
		console.log('Step 1: Update the document status to deleting');
		await step.do(`update-entry`, async () => {
			await documentsStub.updateDocument(name as string, { status: 'deleting' });
		});

		//Step 2: Get the embeddings ids from the mapping and delete the entry
		console.log('Step 2: Get the embeddings ids from the mapping and delete the entry');
		const embeddingIds = await step.do(`get-embedding-ids`, async () => {
			const document = await documentsStub.getDocument(name as string);
			const embeddingIds = document?.embeddingIds || [];
			return embeddingIds;
		});

		//Step 3: Delete the document embedding(s) from the vector
		console.log('Step 3: Delete the document embedding(s) from the vector');
		await step.do(`delete-vector`, async () => {
			return this.env.VECTORIZE.deleteByIds(embeddingIds);
		});

		//Step 4: Generate new search documents tool description
		console.log('Step 4: Generate new search documents tool description');
		await step.do(`update-tool-description`, async () => {
			await documentsStub.updateSearchToolDescriptionOnDelete(name);
		});

		//Step 5: Await step 3: and then delete the document from the DO
		console.log('Step 5: Await vector deletion and then delete the document from the DO');
		await step.do(`delete-entry`, async () => {
			while (true) {
				const results = await this.env.VECTORIZE.getByIds(embeddingIds);
				if (results.length === 0) {
					break;
				}
				await new Promise((r) => setTimeout(r, 1000));
			}
			await documentsStub.deleteDocument(name as string);
		});

		//Finished
		console.log('Delete Document Workflow completed\n\n');
	}
}
