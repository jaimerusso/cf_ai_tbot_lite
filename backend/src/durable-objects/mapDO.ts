import { DurableObject } from 'cloudflare:workers';

const mapDOName = 'map';

type Mapping = {
	ids: string[];
	resumee: string;
};

//Durable object to map the document name (documentId) to its ids in the vector database and holds a resumee of the document
export class Map extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async newMapping(documentId: string, ids: string[], resumee: string): Promise<void> {
		await this.ctx.storage.put(documentId, { ids, resumee });
	}

	async getMapping(documentId: string): Promise<Mapping | null> {
		const entry = await this.ctx.storage.get<Mapping>(documentId);
		return entry || null;
	}

	async deleteMapping(documentId: string): Promise<void> {
		await this.ctx.storage.delete(documentId);
	}
}
