//import { ChatAgent, Lang, LangMessage } from "aiwrapper";
//import { getTools } 

const fs = require(`fs`);
const path = require(`path`);
const readLine = require(`readline`);

const { getChatIds, getAllTextMessages, getStructuredMessages } = require(`./services/telegram`);
const { toCSV } = require(`./utils/csv`);

const CHAT_ID = -1001177034445;

const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function viewMessages() {
	console.log(`connecting to telegram...`);
	const data = await getAllTextMessages(CHAT_ID);
	console.log(`fetched ${data.length} messages.`);
}

async function exportToCsv() {
	console.log(`exporting csv...`);

	try {
		const rows = await getStructuredMessages(CHAT_ID);
		const csv = toCSV(rows);

		const filename = "messages.csv";
		const filepath = path.join(__dirname, filename);

		fs.writeFileSync(filepath, csv);

		console.log(`Successfully exported to ${filename}`);
	} catch(err) {
		console.error(err);
		console.log(`Failed to export`);
	}
}

async function run() {
	console.log(`telegram scrapper`);
	console.log(`1. view messages (json)`);
	console.log(`2. export and download csv`);
	console.log(`3. generate employers csv`);
	console.log(`4. generate employers_user csv`);
	console.log(`5. generate jobs csv`);
	console.log(`6. exit`);

	rl.question(`input: `, async(choice) => {
		switch(choice) {
			case '1':
				await viewMessages();
				break;
			case '2':
				await exportToCsv();
				break;
			case '6':
				console.log(`goodbye!`);
				rl.close();
				process.exit(0);
				return;
			default:
				console.log(`invalid choice`);
		}

		run();
	});
}

run();
