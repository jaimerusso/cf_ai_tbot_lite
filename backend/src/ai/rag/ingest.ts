import { env, WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { documentsDOName } from '../../durable-objects/documentsDO';
import { resumee_instructions, search_documents_instructions } from '../conversational/instructions';
import { toolDescriptionsDOName } from '../../durable-objects/toolDescriptionsDO';

export class IngestWorkflow extends WorkflowEntrypoint<Env, Params> {
	async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('\n\nStarting Ingest Workflow...');
		const { name, content } = event.payload;

		const documentsStub = this.env.DOCUMENTS.getByName(documentsDOName);

		//Step 1: Create the document in the DO
		console.log(name, ' - Step 1: Create the document in the DO');
		await step.do(`create-document`, async () => {
			await documentsStub.newDocument(name as string);
		});

		//Step 2: Generate embedding vector for the document content
		console.log(name, ' - Step 2: Generate vector embedding for the text');
		const embedding = await step.do(`generate-embedding`, async () => {
			const result = (await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: content,
			})) as any;
			const values = result.data?.[0] as number[];
			if (!values) throw new Error('Failed to generate vector embedding');
			return values;
		});

		//Step 3: Insert the embedding and text into the vector database
		console.log(name, ' - Step 3: Insert the embedding and text into the vector database');
		const ids = await step.do(`insert-vector`, async () => {
			const id = crypto.randomUUID();
			await this.env.VECTORIZE.insert([
				{
					id,
					values: embedding,
					metadata: { content },
				},
			]);
			return [id];
		});

		//Step 4: Generate document resumee
		//If is chunked, get the current resumee and update it
		//OR
		//Generate resumee inputting the document in a model
		console.log(name, ' - Step 4: Generate document resumee');
		const resumee = await step.do(`generate-resumee`, async () => {
			const messages = resumee_instructions(content as string);
			const response = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;
			return response.response;
		});

		//Step 5: Generate new search documents tool description
		console.log(name, ' - Step 5: Generate new search documents tool description');
		await step.do(`update-tool-description`, async () => {
			const toolDescriptionsStub = env.TOOL_DESCRIPTIONS.getByName(toolDescriptionsDOName);
			const currentDescription = (await toolDescriptionsStub.getToolDescription()) ?? '';
			const messages = search_documents_instructions(currentDescription, resumee);
			const newDescription = (await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;
			toolDescriptionsStub.updateToolDescription(newDescription.response);
		});

		//Step 6: Update in the mapping
		console.log(name, ' - Step 6: Await vector insertion and then update the entry in the DO');
		await step.do(`update-entry`, async () => {
			while (true) {
				const results = await env.VECTORIZE.getByIds(ids);
				//If all vectors are inserted
				if (results.length === ids.length) {
					break;
				}
				await new Promise((r) => setTimeout(r, 1000));
			}
			await documentsStub.updateDocument(name as string, { status: 'ready', embeddingIds: ids, resumee });
		});

		//returns document id (name)
		console.log(name, ' - Ingest Workflow completed\n\n');
	}
}
