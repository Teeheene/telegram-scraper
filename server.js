const tdl = require('tdl');
const express = require('express');
const cors = require('cors');
const { getTdjson } = require('prebuilt-tdlib');

tdl.configure({ tdjson: getTdjson() })

const app = express();
app.use(cors());
const PORT = 3000;

const client = tdl.createClient({
  apiId:  30589039, // Replace with your api_id
  apiHash: '16c3686abc8083f35752d1808b42d490' // Replace with your api_hash
})

client.on('error', console.error)

async function getAllTextMessages(chatId) {
	await client.login()
	let textMessages = []
	let fromMessageId = 0; 
//
//	//show chat ids 
//	const chats = await client.invoke({
//	 _: 'getChats',
//	 chat_list: { _: 'chatListMain' },
//	 limit: 100
//	})

	//get history
	while(true) {
		const history = await client.invoke({
			_: 'getChatHistory',
			chat_id: chatId,
			from_message_id: fromMessageId,
			offset: 0,
			limit: 10000
		});

		const messages = history.messages;

		if(messages.length == 0) break;

		messages.forEach(message => {
			if (message.content._ === 'messageText') {
				textMessages.push(message.content.text.text);
			}
		});

		fromMessageId = messages[messages.length - 1].id;
	}

	//await client.close();
	return textMessages;
}

app.get('/messages', async(req, res) => {
	try {
		const messages = await getAllTextMessages(-1001177034445);
		res.json(messages);
	} catch(err) {
		console.error(err);
		res.status(500).send('Failed to fetch messages');
	}
});

app.listen(3000, () => {
	console.log('Server running at https://localhost:3000');
});

