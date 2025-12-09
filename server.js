const tdl = require('tdl');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

function toCSV(rows) {
	if(!rows.length) return "";
	const headers = Object.keys(rows[0]);
	const csvLines = rows.map(r => 
		headers.map(h => JSON.stringify(r[h] ?? "")).join(",")
	);

	return headers.join(",") + "\n" + csvLines.join("\n");
}

async function getAllTextMessages(chatId) {
	await client.login()
	let textMessages = []
	let fromMessageId = 0; 
	let count = 0;
	let offset = 0;
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
			limit: 100
		});

		const messages = history.messages;

		if(messages.length == 0) break;

		messages.forEach(message => {
			if (message.content._ === 'messageText') {
				textMessages.push(message.content.text.text);
			}
		});

		fromMessageId = messages[messages.length - 1].id;
		count += 1;
	}

	console.log(count);

	//await client.close();
	return textMessages;
}

async function getStructuredMessages(chatId) {
	await client.login();

	let messages = [];
	let fromMessageId = 0;

	const userCache = {};

	while(true) {
		const history = await client.invoke({
			_: "getChatHistory",
			chat_id: chatId,
			from_message_id: fromMessageId,
			offset: 0,
			limit: 1000
		});

		const batch = history.messages;
		if(batch.length === 0) break;

		for(const msg of batch) {
			if(msg.content._ !== "messageText") continue;

			const dateObj = new Date(msg.date * 1000);
			const dateStr = dateObj.toISOString();
			const text = msg.content.text.text;
			const user = await client.invoke({ _: "getUser", user_id: msg.sender_id.user_id});
			const first = user.first_name || "";
			const last = user.last_name || "";
			const phone = user.phone_number || null;

			messages.push({
				id: msg.id,
				date: dateStr,
				first_name: first,
				last_name: last,
				contact_information: phone,
				text
			});
		}
		fromMessageId = batch[batch.length - 1].id;
	}
	return messages;
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

app.get('/messages.csv', async(req, res) => {
	try {
		const rows = await getStructuredMessages(-1001177034445);
		const csv = toCSV(rows);

		const filename = "messages.csv";
		const filepath = path.join(__dirname, filename);

		fs.writeFileSync(filepath, csv);
		res.download(filepath, filename);
	} catch(err) {
		console.error(err);
		res.status(500).send('Failed to export CSV');
	}
});

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
})
