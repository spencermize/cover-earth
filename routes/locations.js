/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { Strava } = require('../syncs/strava');
let strava;

const Activity = require('../models/Activity');
const auth = require('./auth').auth;

router.use(auth);
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
	const activity = mongoose.model('Activity', Activity);
	const params = {
		'user' : req.user.id
	}
	const returns = ['id', 'location'];
	if (req.params.service) {
		params.service = req.params.service
	} else {
		returns.push('service');
	}

	// console.log(req.user.)
	const query = activity.find(params);
	query.select(returns.join(" "));
	query.exec( (err, result) => {
		if (err) next(err);
		res.json(result);
		res.end();
	});
})
module.exports = router;
