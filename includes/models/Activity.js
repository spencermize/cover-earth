/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const polygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true
  },
  coordinates: {
    type: [[[Number]]], // Array of arrays of arrays of numbers
    required: true
  }
});

const Activity = new Schema({
	id: String,
	last: String,
	service: String,
	user: String,
	location: polygonSchema
	
});

module.exports = Activity;