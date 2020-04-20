/* eslint-disable @typescript-eslint/no-var-requires */
const { PerformanceObserver, performance } = require('perf_hooks');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

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

	performance.mark('a');
	const params = {
		'user' : req.user.id
	}
	const returns = ['id', 'location'];
	if (req.params.service) {
		params.service = req.params.service
	} else {
		returns.push('service');
	}
	performance.mark('b');
	// console.log(req.user.)
	const query = activity.find(params);
	
	performance.mark('c');
	query.select(returns.join(" "));
	performance.mark('d');
	query.exec( (err, result) => {
		if (err) next(err);
		performance.mark('e');
		res.json(result);
		performance.mark('f');
		performance.measure("measure a to b", 'a', 'b');
		performance.measure("measure b to c", 'b', 'c');
		performance.measure("measure c to d", 'c', 'd');
		performance.measure("measure d to e", 'd', 'e');
		performance.measure("measure e to f", 'e', 'f');		
		res.end();
	});
})
module.exports = router;
