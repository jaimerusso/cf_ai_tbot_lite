import { DurableObject } from 'cloudflare:workers';

export const mapDOName = 'map';

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

	async getMappingIds(documentId: string): Promise<string[]> {
		const entry = await this.ctx.storage.get<Mapping>(documentId);
		return entry ? entry.ids : [];
	}

	async deleteMapping(documentId: string): Promise<void> {
		await this.ctx.storage.delete(documentId);
		//await this.ctx.storage.deleteAll();
	}

	async getDocumentsIDs(): Promise<string[]> {
		const entries = await this.ctx.storage.list();
		return [...entries.keys()];
	}
}
