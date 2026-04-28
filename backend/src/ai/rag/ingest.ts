import { WorkflowEntrypoint, WorkflowStep } from 'cloudflare:workers';
import type { WorkflowEvent } from 'cloudflare:workers';
import { documentsDOName } from '../../durable-objects/documentsDO';
import { resumee_instructions } from '../conversational/instructions';
import { toolDescriptionsDOName } from '../../durable-objects/toolDescriptionsDO';

const maxChars = 800;
const overlap = 150;

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

		//-----------CHUNKED-------------------
		//Step 2: Chunk the content
		console.log(name, ' - Step 2: Chunk the content');
		const chunks = await step.do(`chunk-content`, async () => {
			return chunkContent(content as string);
		});

		let ids: string[] = [];

		for (const [i, chunk] of chunks.entries()) {
			//Step 3: Generate embedding vector for the chunk
			console.log(`${name}:chunk[${i}] - Step 3: Generate vector embedding for the chunk`);
			const embedding = await step.do(`generate-embedding-${i}`, async () => {
				const result = (await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: chunk,
				})) as any;
				const values = result.data?.[0] as number[];
				if (!values) throw new Error('Failed to generate vector embedding');
				return values;
			});

			//Step 3: Insert the embedding and chunk into the vector database
			console.log(`${name}:chunk[${i}] - Step 4: Insert the embedding and chunk into the vector database`);
			await step.do(`insert-vector-${i}`, async () => {
				const id = crypto.randomUUID();
				await this.env.VECTORIZE.insert([
					{
						id,
						values: embedding,
						metadata: { chunk },
					},
				]);
				return ids.push(id);
			});
		}

		//Step 4: Generate document resumee
		console.log(name, ' - Step 4: Generate document resumee');
		const resumee = await step.do(`generate-resumee`, async () => {
			const messages = resumee_instructions(content as string);
			const response = (await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;
			return response.response;
		});

		//Step 5: Generate new search documents tool description
		console.log(name, ' - Step 5: Generate new search documents tool description');
		await step.do(`update-tool-description`, async () => {
			const toolDescriptionsStub = this.env.TOOL_DESCRIPTIONS.getByName(toolDescriptionsDOName);
			await toolDescriptionsStub.updateToolDescription(resumee, true);
		});

		//Step 6: Update in the mapping
		console.log(name, ' - Step 6: Await vector insertion and then update the entry in the DO');
		await step.do(`update-entry`, async () => {
			while (true) {
				const results = await this.env.VECTORIZE.getByIds(ids);
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

function chunkContent(content: string): string[] {
	const contentLenght = content.length;
	if (contentLenght <= maxChars) return [content];

	let chunks: string[] = [];

	let start: number = 0;
	while (start < contentLenght) {
		//The end is the minimum between the supposed chunk end (start+maxChars) or the contentLength
		let end = Math.min(start + maxChars, contentLenght);

		//Check for \n inside the chunk
		if (end < contentLenght) {
			const nl = content.lastIndexOf('\n', end);
			//If found and has at least 100 chars from the start, define de new end
			if (nl !== -1 && nl > start + 100) {
				end = nl;
			}
		}

		chunks.push(content.slice(start, end).trim());
		const nextStart = end - overlap; //Overlap for better context
		if (nextStart <= start) break;
		start = nextStart;
	}
	return chunks;
}
