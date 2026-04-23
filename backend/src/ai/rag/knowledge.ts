import { env } from 'cloudflare:workers';
import { pollWorkflow } from '../../common/workflow';

export async function addDocument(document: string) {
	const instance = await env.INGEST_WORKFLOW.create({
		params: { document },
	});

	const documentId = await pollWorkflow<string>(instance);

	return documentId;
}

export async function deleteDocument(documentId: string) {
	const instance = await env.DELETE_DOCUMENT_WORKFLOW.create({
		params: { documentId },
	});

	await pollWorkflow(instance);

	//
	return documentId;
}
