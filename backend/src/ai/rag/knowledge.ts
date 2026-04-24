import { env } from 'cloudflare:workers';
import { documentsDOName } from '../../durable-objects/documentsDO';

export async function addDocument(documents: File[]) {
	//Process each document in parallel
	await Promise.all(
		documents.map(async (document) => {
			env.INGEST_WORKFLOW.create({
				params: { name: document.name, content: await document.text() },
			});
		}),
	);
	return;
}

export async function deleteDocument(name: string) {
	const documentStub = env.DOCUMENTS.getByName(documentsDOName);
	const document = await documentStub.getDocument(name);

	//If document doensnt exist, throw error
	if (!document) {
		throw new Error(`Document not found: ${name}`);
	}

	//If document is already being deleted, throw error
	if (document.status === 'deleting') {
		throw new Error(`Document is already being deleted: ${name}`);
	}

	env.DELETE_DOCUMENT_WORKFLOW.create({
		params: { name },
	});

	return;
}
