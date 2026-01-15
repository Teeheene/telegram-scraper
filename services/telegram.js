const tdl = require('tdl');
const { getTdjson } = require('prebuilt-tdlib');

tdl.configure({ tdjson: getTdjson() })

const client = tdl.createClient({
  apiId:  30589039, 
	apiHash: '16c3686abc8083f35752d1808b42d490'
})
client.on('error', console.error)

async function getChatIds() {
	//show chat ids 
	const chats = await client.invoke({
	 _: 'getChats',
	 chat_list: { _: 'chatListMain' },
	 limit: 100
	})

	console.log(chats);
}

async function getAllTextMessages(chatId) {
	await client.login()
	let textMessages = []
	let fromMessageId = 0; 
	let totalFetched = 0;
	let requestCount = 0;
	let offset = 0;

	//get history
	while(true) {
		requestCount++;

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
			if(message.content._ === 'messageText') {
				textMessages.push(message.content.text.text);
				totalFetched++;
			}
		});

		fromMessageId = messages[messages.length - 1].id;

		//console.log(`Request ${requestCount} | Total messages scanned: ${totalFetched} | Current ID: ${fromMessageId}`);
	}

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
			let text, dateStr, username, first, last, phone, type;
			
			if(msg.content._ === "messageText") {
				text = msg.content.text.text;
				type = "text message";
			} 

			else if(msg.content._ === "messagePhoto") {
				text = msg.content.caption?.text || '';
				type = "photo caption";
			} 

			dateStr = new Date(msg.date * 1000).toISOString();

			// Only fetch user info if sender is a user
			if (msg.sender_id._ === "messageSenderUser") {
				const userId = msg.sender_id.user_id;

				let user;
				if (userCache[userId]) {
					user = userCache[userId];
				} else {
					user = await client.invoke({ 
						_: "getUser", 
						user_id: userId
					});
					userCache[userId] = user;
				}

				username = 
					(user.usernames?.active_usernames?.[0]) ||
					user.usernames?.editable_username ||
					"";
				first = user.first_name || "";
				last = user.last_name || "";
				phone = user.phone_number || null;
			} else {
				// For channels or anonymous admins
				username = null;
				first = "";
				last = "";
				phone = null;
			}

			messages.push({
				id: msg.id,
				date: dateStr,
				first_name: first,
				last_name: last,
				username,
				contact_information: phone,
				type,
				text
			});
		}

		fromMessageId = batch[batch.length - 1].id;
	}
	return messages;
}

module.exports = {
	getChatIds,
	getAllTextMessages,
	getStructuredMessages
};
