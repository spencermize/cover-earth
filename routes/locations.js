/* eslint-disable @typescript-eslint/no-var-requires */
const { PerformanceObserver, performance } = require('perf_hooks');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const JSONStream = require('JSONStream');

const { Strava } = require('../includes/syncs/Strava');
let strava;

const Activity = require('../includes/models/Activity');
const activity = mongoose.model('Activity', Activity);
const auth = require('./auth').auth;
router.use(auth);

const obs = new PerformanceObserver((items) => {
  console.log(`${items.getEntries()[0].name}: ${items.getEntries()[0].duration}`);
});
obs.observe({ entryTypes: ['measure'] });

router.use(function(req, res, next) {
	strava = new Strava();
	strava.setId(req.user.strava.access);
	next();
})
router.get('/profile/:service', async function(req, res, next) {
	switch (req.params.service) {
		case "strava" : 
			res.send(await strava.athlete.get({}));
			break;
		default :
			res.json(false);
	}
})
router.get('/sync/:service', async function(req, res, next){
	switch (req.params.service) {
		case "strava" : 
			res.send(await strava.loadAll(req.user.id));
			break;
		default :
			res.json(false);
	}
})

router.get('/:service?', async function(req, res, next){
	const params = {
		'user' : req.user.id
	}
	const returns = ['id', 'location'];
	if (req.params.service) {
		params.service = req.params.service
	} else {
		returns.push('service');
	}
	const query = activity.find(params)
		.cursor()
		.pipe(JSONStream.stringify())
		.pipe(res.type('json'));

})

router.get('/:service/:bbox', async function(req, res, next){
	// const [e, n, w, s] = req.params.bbox.split(',');
	const [w, s, e, n] = req.params.bbox.split(',');

	//convert everything to numbers
	const east = +e,
		north = +n,
		west = +w,
		south = +s
	const geometry = {
		type: 'Polygon',
		coordinates: [[
			[east, north],
			[east, south],
			[west, south],
			[west, north],
			[east, north]
		]]
	}
	const params = {
		'user' : req.user.id,
		'service' : req.params.service,
	}

	const geo = {
		near: { type: 'Point', coordinates: [east, north]},
		distanceField: 'distance',
		spherical: true,
		query: {
			'location' : {
				$geoIntersects: {
					$geometry: geometry
				}
			}
		}	
	}
	const stream = activity.aggregate([
		{
			$geoNear: geo
		},
		{
			$match: params
		}])
		.cursor({batchSize: 5}).exec()

	stream.pipe(JSONStream.stringify())
		.pipe(res.type('json'));
	// stream.on('data', (data) => {

	// 	res.write(JSONStream.stringify(data));
	// })
	// stream.on('end', () => {
	// 	res.end();
	// });
		// .pipe(JSONStream.stringify())
		// .pipe(res.type('json'));
})
module.exports = router;
