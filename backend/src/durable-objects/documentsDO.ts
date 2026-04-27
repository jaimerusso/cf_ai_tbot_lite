import { DurableObject } from 'cloudflare:workers';
import { toolDescriptionsDOName } from './toolDescriptionsDO';

export const documentsDOName = 'documents';

export type Document = {
	name: string;
	embeddingIds: string[];
	resumee: string;
	status: 'processing' | 'deleting' | 'ready';
	lastUpdated: number;
};

//Durable object to map the document name (id) to its ids in the vector database and holds a resumee of the document
export class Documents extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async updateSearchToolDescriptionOnDelete(documentName: string): Promise<void> {
		const toolDescriptionsStub = this.env.TOOL_DESCRIPTIONS.getByName(toolDescriptionsDOName);
		const entries = await this.getDocuments();

		const hasActive = entries.some((e: Document) => e.status !== 'deleting' && e.name !== documentName);

		if (!hasActive) {
			await toolDescriptionsStub.updateToolDescription('', false, documentName);
			return;
		}

		const deletedDocument = await this.getDocument(documentName);
		const resumee = deletedDocument?.resumee ?? '';
		await toolDescriptionsStub.updateToolDescription(resumee, false, documentName);
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
			status: 'processing' | 'deleting' | 'ready';
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

	async deleteDocument(name: string): Promise<void> {
		await this.ctx.storage.delete(name);
	}

	async getDocuments(): Promise<Document[]> {
		const entries = await this.ctx.storage.list<Document>();
		return Array.from(entries.values());
	}

	async deleteAll(): Promise<void> {
		await this.ctx.storage.deleteAll();
	}
}
