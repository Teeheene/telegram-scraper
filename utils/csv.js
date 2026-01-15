function toCSV(rows) {
	if(!rows.length) return "";
	const headers = Object.keys(rows[0]);
	const csvLines = rows.map(r => 
		headers.map(h => JSON.stringify(r[h] ?? "")).join(",")
	);

	return headers.join(",") + "\n" + csvLines.join("\n");
}

module.exports = { toCSV };
