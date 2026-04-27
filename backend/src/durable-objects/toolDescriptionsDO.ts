import { DurableObject } from 'cloudflare:workers';
import { remove_search_documents_instructions, search_documents_instructions } from '../ai/conversational/instructions';

//Used to refer to the DO but also to the key in which the description is stored inside the DO storage
export const toolDescriptionsDOName = 'tool-descriptions';

export class ToolDescriptions extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	//Update search tool description, called every time a single document is being processed
	//If ingestion process, generate new description using the document resumee and save it
	//If deletion process, check resumee:
	//-Empty string: update the description to empty string (no ready documents)
	//-Not empty: generate new description, removing the document information from the description and update it
	async updateToolDescription(resumee: string, ingest?: boolean): Promise<void> {
		//Block concurrency so that the order of the documents is kept even when awaiting external calls
		await this.ctx.blockConcurrencyWhile(async () => {
			const currentDescription = await this.getToolDescription();

			let newDescription = '';
			let messages: RoleScopedChatInput[] = [];

			if (resumee) {
				if (ingest) {
					messages = search_documents_instructions(currentDescription, resumee);
				} else {
					messages = remove_search_documents_instructions(currentDescription, resumee);
				}
				const res = (await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages })) as any;
				newDescription = res.response;
			}
			await this.ctx.storage.put(toolDescriptionsDOName, newDescription);
		});
	}

	async getToolDescription(): Promise<string> {
		const description = await this.ctx.storage.get<string>(toolDescriptionsDOName);
		return description ?? '';
	}
}
