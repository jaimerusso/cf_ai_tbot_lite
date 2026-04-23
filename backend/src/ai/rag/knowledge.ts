import { env } from 'cloudflare:workers';

export async function addDocument(document: string) {
	const instance = await env.INGEST_WORKFLOW.create({
		params: { document },
	});

	return document;
}

export async function deleteDocument(documentId: string) {
	return documentId;
}
