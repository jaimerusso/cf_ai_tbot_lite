export { ChatWorkflow } from './ai/conversational/conversational';
export { SearchWorkflow } from './ai/rag/search';
export { IngestWorkflow } from './ai/rag/ingest';
export { DeleteDocumentWorkflow } from './ai/rag/deleteDocument';
export { ChatRoom } from './durable-objects/chatRoomDO';
export { Dialogues } from './durable-objects/dialoguesDO';
export { Map } from './durable-objects/mapDO';

import { dialoguesDOName } from './durable-objects/dialoguesDO';
import { chatRoomDOName } from './durable-objects/chatRoomDO';
import { mapDOName } from './durable-objects/mapDO';

import { addDocument, deleteDocument } from './ai/rag/knowledge';

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	const dialoguesStub = env.DIALOGUES.getByName(dialoguesDOName);

	const dialoguesPattern = new URLPattern({ pathname: '/dialogues' });
	const dialoguesMatch = dialoguesPattern.exec(url);
	if (dialoguesMatch && request.method === 'GET') {
		return dialoguesStub.getDialogueIds();
	}
	if (dialoguesMatch && request.method === 'POST') {
		return dialoguesStub.newDialogue();
	}

	const dialogueParamsPattern = new URLPattern({ pathname: '/dialogues/:id' });
	const dialogueParamsMatch = dialogueParamsPattern.exec(url);
	if (dialogueParamsMatch && request.method === 'GET') {
		const dialogueId = dialogueParamsMatch.pathname.groups.id;
		return dialoguesStub.getDialogue(dialogueId);
	}
	if (dialogueParamsMatch && request.method === 'DELETE') {
		const dialogueId = dialogueParamsMatch.pathname.groups.id;
		return dialoguesStub.deleteDialogue(dialogueId);
	}

	const knowledgePattern = new URLPattern({ pathname: '/knowledge' });
	const knowledgeMatch = knowledgePattern.exec(url);
	if (knowledgeMatch && request.method === 'POST') {
		const body = await request.text();
		if (!body) {
			return new Response('Empty body', { status: 400 });
		}
		return Response.json({ documentName: await addDocument(await body) });
	}
	if (knowledgeMatch && request.method === 'GET') {
		const mapStub = env.MAP.getByName(mapDOName);
		return Response.json({ documentIds: await mapStub.getDocumentsIDs() });
	}

	const knowledgeParamsPattern = new URLPattern({ pathname: '/knowledge/:id' });
	const knowledgeParamsMatch = knowledgeParamsPattern.exec(url);
	if (knowledgeParamsMatch && request.method === 'DELETE') {
		const documentId = knowledgeParamsMatch.pathname.groups.id;
		return Response.json({ documentId: await deleteDocument(documentId) });
	}

	if (request.headers.get('Upgrade') === 'websocket') {
		const chatStub = env.CHAT_ROOM.getByName(chatRoomDOName);
		return chatStub.fetch(request);
	}

	return new Response('Not found', { status: 404 });
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const response = await handleRequest(request, env, ctx);

		if (request.headers.get('Upgrade') === 'websocket') {
			return response;
		}

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': '*',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		//Put all corsHeaders as headers for the response
		const newResponse = new Response(response.body, response);
		Object.entries(corsHeaders).forEach(([key, value]) => {
			newResponse.headers.set(key, value);
		});
		return newResponse;
	},
} satisfies ExportedHandler<Env>;
