/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');
class DB {
	async connect() {
		return await mongoose.connect(process.env.MONGO, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		});
	}
}

const db = new DB;
module.exports = db;