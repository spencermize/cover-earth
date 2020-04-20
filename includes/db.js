/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');
class DB {
	async connect() {
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		});

		console.log('connected to db');
		return conn;
	}
}

const db = new DB;
module.exports = db;