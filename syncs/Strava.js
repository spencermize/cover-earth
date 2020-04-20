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
		const perPage = 200;
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
			let coords;
			const activity = mongoose.model('Activity', Activity);
			if (act.type.toLowerCase().includes("virtual")) {
				activity.deleteOne({id: act.id.toString()}, function(){
					console.log(act.id);	
				})
			} else {
				try{
					activity.findOne({id: act.id.toString(), user, service}, async function(err, doc){
						if(doc && doc.location && doc.location.coordinates && doc.location.coordinates.length){
							// console.log('already synced')
						} else {
							coords = await stravaApi.streams.activity({
								types: "latlng",
								id: act.id
							}).filter( ret => ret.type == 'latlng' );
						}

						if (coords && coords.length) { 
							try {
								await new Promise( (res, rej) =>{
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
							} catch (e) {
								console.log(e);
							}
						}
					});						
				} catch(e){
					console.log(e);
				}
			}

		}

		return {success: true}
	}
}

module.exports ={
	Strava
};