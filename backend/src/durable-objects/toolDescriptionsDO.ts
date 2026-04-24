import { DurableObject } from 'cloudflare:workers';

//Used to refer to the DO but also to the key in which the description is stored inside the DO storage
export const toolDescriptionsDOName = 'tool-descriptions';

export class ToolDescriptions extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async newToolDescription(description: string): Promise<void> {
		await this.ctx.storage.put(toolDescriptionsDOName, description);
	}

	async getToolDescription(): Promise<string | undefined> {
		return await this.ctx.storage.get<string>(toolDescriptionsDOName);
	}
}
