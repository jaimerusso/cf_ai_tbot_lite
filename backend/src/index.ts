export { ChatWorkflow } from './ai/conversational/conversational';
export { SearchWorkflow } from './ai/rag/search';
export { IngestWorkflow } from './ai/rag/ingest';
export { DeleteDocumentWorkflow } from './ai/rag/deleteDocument';
export { ChatRoom } from './durable-objects/chatRoomDO';
export { Dialogues } from './durable-objects/dialoguesDO';
export { Map } from './durable-objects/mapDO';

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { dialoguesDOName } from './durable-objects/dialoguesDO';
import { chatRoomDOName } from './durable-objects/chatRoomDO';
import { mapDOName } from './durable-objects/mapDO';

import { addDocument, deleteDocument } from './ai/rag/knowledge';

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
	const body = await c.req.text();
	if (!body) return c.json({ error: 'Empty body' }, 400);
	return c.json({ documentName: await addDocument(body) });
});

app.get('/knowledge', async (c) => {
	const mapStub = c.env.MAP.getByName(mapDOName);
	return c.json({ documentIds: await mapStub.getDocumentsIDs() });
});

app.delete('/knowledge/:id', async (c) => {
	const documentId = c.req.param('id');
	return c.json({ documentId: await deleteDocument(documentId) });
});

// WebSocket
app.get('/ws', (c) => {
	if (c.req.header('Upgrade') !== 'websocket') {
		return c.json({ error: 'Expected WebSocket' }, 426);
	}
	const chatStub = c.env.CHAT_ROOM.getByName(chatRoomDOName);
	return chatStub.fetch(c.req.raw);
});

export default app;
