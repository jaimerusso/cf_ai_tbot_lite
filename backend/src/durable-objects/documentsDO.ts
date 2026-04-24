import { DurableObject } from 'cloudflare:workers';

export const documentsDOName = 'documents';

type Document = {
	name: string;
	embeddingIds: string[];
	resumee: string;
	status: 'processing' | 'ready' | 'error';
	lastUpdated: number;
};

//Durable object to map the document name (id) to its ids in the vector database and holds a resumee of the document
export class Documents extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async newDocument(name: string): Promise<void> {
		await this.ctx.storage.put(name, {
			name,
			embeddingIds: [],
			resumee: '',
			status: 'processing',
			lastUpdated: Date.now(),
		});
	}

	async updateDocument(
		name: string,
		updates: Partial<{
			status: 'processing' | 'deleting' | 'ready' | 'error';
			embeddingIds: string[];
			resumee: string;
		}>,
	): Promise<void> {
		const existing = await this.ctx.storage.get<Document>(name);

		await this.ctx.storage.put(name, {
			...existing,
			...updates,
			name,
			lastUpdated: Date.now(),
		});
	}

	async getDocument(name: string): Promise<Document | undefined> {
		return await this.ctx.storage.get<Document>(name);
	}

	//async getEmbeddingIds(documentName: string): Promise<string[]> {
	//	const entry = await this.ctx.storage.get<Document>(documentName);
	//	return entry ? entry.embeddingIds : [];
	//}

	async deleteDocument(name: string): Promise<void> {
		await this.ctx.storage.delete(name);
		//await this.ctx.storage.deleteAll();
	}

	async getDocuments(): Promise<Document[]> {
		const entries = await this.ctx.storage.list<Document>();
		return Array.from(entries.values());
	}

	async deleteAll(): Promise<void> {
		await this.ctx.storage.deleteAll();
	}
}
