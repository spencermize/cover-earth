/* eslint-disable @typescript-eslint/no-var-requires */
const stravaApi = require('strava-v3');
const mongoose = require('mongoose');
const Activity = require('../models/Activity');

class Strava {
	constructor() {
		this.config();
	}
	setId(id){
		stravaApi.client(id);
	}
	config(){
		stravaApi.config({
			"client_id"     : process.env.STRAVA_CLIENT_ID,
			"client_secret" : process.env.STRAVA_CLIENT_SECRET,
		});	
	}

	async loadAll(user){
		let page = 1;
		const perPage = 10;
		const activities = [];
		const service = 'strava';
		let keepLooping = true;

		while( keepLooping ) {
			const results = await stravaApi.athlete.listActivities({
				page,
				// eslint-disable-next-line @typescript-eslint/camelcase
				per_page: perPage
			});
			console.log(page);
			activities.push(...results);

			if ( results.length === perPage ){
				keepLooping = true;
				page++;
			} else {
				keepLooping = false;
			}
		}

		for (let i=0; i < activities.length; i++){
			const act = activities[i];
			const coords = await stravaApi.streams.activity({
				types: "latlng",
				id: act.id
			}).filter( ret => ret.type == 'latlng' );
			await new Promise( (res, rej) =>{
				const activity = mongoose.model('Activity', Activity);
				const options = { upsert: true, new: true, setDefaultsOnInsert: true };
				const params = {
					id: act.id.toString(),
					last: Date.now(),
					service,
					user,
					location: {
						type: "Polygon",
						coordinates: [coords[0].data]
					}
				}	

				try{
					activity.findOneAndUpdate({'id' : act.id, service}, params, options, function(){
						res();
					});

				} catch (e) {
					console.log(e);
					rej();
				}
			});
		}

		return {success: true}
	}
}

module.exports ={
	Strava
};