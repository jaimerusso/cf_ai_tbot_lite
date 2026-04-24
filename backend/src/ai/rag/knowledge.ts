import { env } from 'cloudflare:workers';
import { documentsDOName } from '../../durable-objects/documentsDO';

export async function addDocument(documents: File[]) {
	const documentStub = env.DOCUMENTS.getByName(documentsDOName);

	//Define error constants
	const alreadyExists: string[] = [];
	const emptyFiles: string[] = [];
	//Process each document in parallel
	await Promise.all(
		documents.map(async (document) => {
			const name = document.name;
			const entry = await documentStub.getDocument(name);
			if (entry && entry.name === name) {
				alreadyExists.push(name);
			} else {
				const content = await document.text();
				if (content.length === 0) {
					emptyFiles.push(name);
				} else {
					env.INGEST_WORKFLOW.create({
						params: { name: document.name, content },
					});
				}
			}
		}),
	);
	return { alreadyExists, emptyFiles };
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
