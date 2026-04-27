import { env } from 'cloudflare:workers';
import { documentsDOName } from '../../durable-objects/documentsDO';

const isPlainText = (buffer: ArrayBuffer): boolean => {
	const bytes = new Uint8Array(buffer.slice(0, 1024));
	return !bytes.some((b) => b === 0);
};

export async function addDocument(documents: File[]) {
	const documentStub = env.DOCUMENTS.getByName(documentsDOName);

	//Define error constants
	const notPlain: string[] = [];
	const alreadyExists: string[] = [];
	const emptyFiles: string[] = [];

	//Process each document in parallel
	await Promise.all(
		documents.map(async (document) => {
			const name = document.name;
			const entry = await documentStub.getDocument(name);
			//Verify is already exists
			if (entry && entry.name === name) {
				alreadyExists.push(name);
			} else {
				//Verify if is not plain
				if (!isPlainText(await document.arrayBuffer())) {
					notPlain.push(name);
					return;
				}
				const content = await document.text();
				//Verify if is empty
				if (content.length === 0) {
					emptyFiles.push(name);
				} else {
					await env.INGEST_WORKFLOW.create({
						params: { name: document.name, content },
					});
				}
			}
		}),
	);
	return { notPlain, alreadyExists, emptyFiles };
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

	await env.DELETE_DOCUMENT_WORKFLOW.create({
		params: { name },
	});

	return;
}
