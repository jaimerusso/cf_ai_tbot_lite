import { DurableObject } from 'cloudflare:workers';

//Used to refer to the DO but also to the key in which the description is stored inside the DO storage
export const toolDescriptionsDOName = 'tool-descriptions';

export class ToolDescriptions extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async updateToolDescription(description: string): Promise<void> {
		console.log('Saving new tool description...');
		await this.ctx.storage.put(toolDescriptionsDOName, description);
	}

	async getToolDescription(): Promise<String> {
		const description = await this.ctx.storage.get<string>(toolDescriptionsDOName);
		return description ?? '';
	}
}
