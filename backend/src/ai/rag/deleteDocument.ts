import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { Document, documentsDOName } from '../../durable-objects/documentsDO';
import { toolDescriptionsDOName } from '../../durable-objects/toolDescriptionsDO';
import { remove_search_documents_instructions } from '../conversational/instructions';

export class DeleteDocumentWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Delete Document Workflow...');
		const { name } = event.payload;

		const documentsStub = env.DOCUMENTS.getByName(documentsDOName);

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
			return env.VECTORIZE.deleteByIds(embeddingIds);
		});

		//Step 4: Generate new tool description
		console.log('Step 4: Generate new search documents tool description');
		await step.do(`update-tool-description`, async () => {
			const toolDescriptionsStub = this.env.TOOL_DESCRIPTIONS.getByName(toolDescriptionsDOName);
			const entries = await documentsStub.getDocuments();

			//If no documents remain, reset the tool description
			const hasActiveDocuments = entries.some((e: Document) => e.status !== 'deleting');
			if (!hasActiveDocuments) {
				await toolDescriptionsStub.updateToolDescription('');
				return;
			}

			//Or just create a new one and update it
			const currentDescription = (await toolDescriptionsStub.getToolDescription()) ?? '';
			const thisResumee = await documentsStub.getDocument(name as string);
			const messages = remove_search_documents_instructions(currentDescription, thisResumee);
			const newDescription = (await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;
			toolDescriptionsStub.updateToolDescription(newDescription.response);
		});

		//Step 5: Await step 3: and then delete the document from the DO
		console.log('Step 5: Await vector deletion and then delete the document from the DO');
		await step.do(`delete-entry`, async () => {
			while (true) {
				const results = await env.VECTORIZE.getByIds(embeddingIds);
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
