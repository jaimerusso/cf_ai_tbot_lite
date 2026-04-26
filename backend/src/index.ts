export { ChatWorkflow } from './ai/conversational/conversational';
export { SearchWorkflow } from './ai/rag/search';
export { IngestWorkflow } from './ai/rag/ingest';
export { DeleteDocumentWorkflow } from './ai/rag/deleteDocument';
export { ChatRoom } from './durable-objects/chatRoomDO';
export { Dialogues } from './durable-objects/dialoguesDO';
export { Documents } from './durable-objects/documentsDO';
export { ToolDescriptions } from './durable-objects/toolDescriptionsDO';

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { dialoguesDOName } from './durable-objects/dialoguesDO';
import { chatRoomDOName } from './durable-objects/chatRoomDO';
import { documentsDOName } from './durable-objects/documentsDO';

import { addDocument, deleteDocument } from './ai/rag/knowledge';
import { tools } from './ai/conversational/tools';

const app = new Hono<{ Bindings: Env }>();

app.use(
	'*',
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['*'],
	}),
);

// Dialogues
app.get('/dialogues', (c) => {
	const dialoguesStub = c.env.DIALOGUES.getByName(dialoguesDOName);
	return dialoguesStub.getDialogueIds();
});

app.post('/dialogues', (c) => {
	const dialoguesStub = c.env.DIALOGUES.getByName(dialoguesDOName);
	return dialoguesStub.newDialogue();
});

app.get('/dialogues/:id', (c) => {
	const dialoguesStub = c.env.DIALOGUES.getByName(dialoguesDOName);
	return dialoguesStub.getDialogue(c.req.param('id'));
});

app.delete('/dialogues/:id', (c) => {
	const dialoguesStub = c.env.DIALOGUES.getByName(dialoguesDOName);
	return dialoguesStub.deleteDialogue(c.req.param('id'));
});

// Knowledge
app.post('/knowledge', async (c) => {
	const formData = await c.req.formData();
	const files = formData.getAll('files') as File[];
	const { notPlain, alreadyExists, emptyFiles } = await addDocument(files);

	if (alreadyExists.length === 0 && emptyFiles.length === 0 && notPlain.length === 0) {
		return c.json({ message: 'Documents added successfully' });
	}

	return c.json({
		message: 'Some documents were not added',
		notPlain,
		alreadyExists,
		emptyFiles,
	});
});
app.get('/knowledge', async (c) => {
	const documentsStub = c.env.DOCUMENTS.getByName(documentsDOName);
	return c.json({ documents: await documentsStub.getDocuments() });
});

app.delete('/knowledge/:name', async (c) => {
	try {
		const documentName = c.req.param('name');
		await deleteDocument(documentName);
		return c.json({ message: 'Document deleted successfully' });
	} catch (error) {
		return c.json({ error: (error as Error).message }, 400);
	}
});

// WebSocket
app.get('knowledge/ws', (c) => {
	if (c.req.header('Upgrade') !== 'websocket') {
		return c.json({ error: 'Expected WebSocket' }, 426);
	}
	const chatStub = c.env.CHAT_ROOM.getByName(chatRoomDOName);
	return chatStub.fetch(c.req.raw);
});

// Testing endpoints
app.delete('/vectors', async (c) => {
	const { ids } = await c.req.json<{ ids: string[] }>();
	await c.env.VECTORIZE.deleteByIds(ids);
	return c.json({ success: true });
});
app.delete('/documents/all', async (c) => {
	const documentsStub = c.env.DOCUMENTS.getByName(documentsDOName);
	await documentsStub.deleteAll();
	return c.json({ success: true });
});
app.get('/tool-description', async (c) => {
	return c.json(await tools());
});
/*-------------------------------------------------*/

// WebSocket
app.get('/ws', (c) => {
	if (c.req.header('Upgrade') !== 'websocket') {
		return c.json({ error: 'Expected WebSocket' }, 426);
	}
	const chatStub = c.env.CHAT_ROOM.getByName(chatRoomDOName);
	return chatStub.fetch(c.req.raw);
});

export default app;
