<template>
	<div class="wrapper">
		<link rel="stylesheet" href="https://openlayers.org/en/latest/css/ol.css" type="text/css">
		<v-system-bar :lights-out="true">
			<v-spacer></v-spacer>
				<v-tooltip bottom>
					<template v-slot:activator="{ on }">
						<v-icon v-on:click="sync()" v-on="on">mdi-database-refresh</v-icon>
					</template>
					<span>Sync Database</span>
				</v-tooltip>
				<v-tooltip bottom>
					<template v-slot:activator="{ on }">				
						<v-icon v-on:click="mapVisible()" v-on="on">mdi-card-search-outline</v-icon>
					</template>
					<span>Map Visible Dots</span>
				</v-tooltip>						
				<v-tooltip bottom>
					<template v-slot:activator="{ on }">						
						<v-icon v-on:click="mapAll()" v-on="on">mdi-star-four-points-outline</v-icon>
					</template>
					<span>Map All Dots</span>
				</v-tooltip>						
				<v-tooltip bottom>
					<template v-slot:activator="{ on }">						
						<v-icon v-on:click="$emit('login-change', false)" v-on="on">mdi-logout-variant</v-icon>
					</template>
					<span>Logout</span>
				</v-tooltip>						
		</v-system-bar>
		<div id="map"></div>	
		<div ref="popup" v-show="false">Hi there!</div>
		<v-snackbar v-if="message.length">{{ message }}</v-snackbar>		
		<loading v-if="loading"></loading>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import * as L from 'leaflet'; 
	import glify from 'leaflet.glify';
	import * as oboe from 'oboe';
	import Loading from "./Loading.vue";
	import flip from '@turf/flip';
	import { cleanCoords } from '@turf/clean-coords';
	import turf, { Geometry } from '@turf/helpers';

	// Try out OpenLayers
	import Map from 'ol/Map';
	import View from 'ol/View';
	import TileLayer from 'ol/layer/Tile';
	import XYZ from 'ol/source/XYZ';
	import {defaults} from 'ol/interaction';
	import {toLonLat} from 'ol/proj';
	import WebGLPointsLayer from 'ol/layer/WebGLPoints';
	import GeoJSON from 'ol/format/GeoJSON';
	import Vector from 'ol/source/Vector';
	import Geolocation from 'ol/Geolocation';
	import CircleStyle from 'ol/style/Circle';
	import {Fill, Stroke, Style} from 'ol/style';
	import Feature from 'ol/Feature';
	import Point from 'ol/geom/Point';
	export default Vue.extend({
		name: 'Main',
		components: { Loading },
		props: {
			user: String,
		},
		data()  { 
			return {
				map: {} as Map,
				message: "" as string,
				loading: false as boolean,
				webGl: {} as any,
				points: [] as [[number, number]?],
				renderCycle: 0 as number
			}
		},
		methods: {
			buildWebGl: function() {
				this.webGl = glify.points({
					map: this.map,
					size: 5,
					color: {r: 92/255, g: 65/255, b:93/255},
					opacity: 1,
					data: [],
					preserveDrawingBuffer: true,
					clearOnRender: false,
					click: (e: Event, feature: any) =>{
						console.log(feature);
					}
				});	
			},

			sync: async function() {
				try {
					this.loading = true;
					const results = await fetch('/api/locations/sync/strava');
					await results.json();
					this.loading = false;
					this.message = 'Successfully synced!';
				} catch (e) {
					this.message = 'Error syncing';
				}
			},

			startRender: function() {
				this.renderCycle = window.setInterval(() => {
					console.log('rendering');
					try{
						this.webGl.render();
						this.webGl.settings.data = [];	
					} catch(e){
						console.log(this.webGl.settings.data);
					}
				}, 1000);				
			},

			mapVisible: async function() {
				// const zoom = this.map.getZoom();
				// this.map.setZoom(1);
				// this.startRender();		
				const extents = this.map.getView().calculateExtent();
				const bboxString1 = toLonLat([extents[0],extents[1]]).join(',');
				const bboxString2 = toLonLat([extents[2],extents[3]]).join(',');
				const bboxString = `${bboxString1},${bboxString2}`;
				await this.loadPoints(`/api/locations/strava/${bboxString}`);

				// await this.loadPoints(`/api/locations/strava/${this.map.getBounds().toBBoxString()}`);
				// this.map.setZoom(zoom);
			},	

			mapAll: async function(){
				this.loadPoints('/api/locations/strava');
				this.startRender();
			},

			loadPoints: function(location: string) {
				return new Promise( (res, rej) => {
					this.loading = true;
					const vectorSource = new Vector({
						format: new GeoJSON(),
					});
					const pointsLayer = new WebGLPointsLayer({
						source: vectorSource,
						style: {
							// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
							// @ts-ignore							
							symbol: {
								// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
								// @ts-ignore								
								symbolType: 'circle',
								size: 8,
								color: '#FF0000',
								opacity: 0.9
							}
						},
						disableHitDetection: false
					});
					this.map.addLayer(pointsLayer);
					oboe(location)
						.node('location.coordinates', (coordinates: [[number, number]]) => {
							const newFeatures: Feature[] = [];
							coordinates.forEach( coordinate => {
								newFeatures.push(new Feature({
									geometry: new Point(coordinate)
								}));
							} )
							vectorSource.addFeatures(newFeatures);
							console.log(vectorSource);
							
						})
						.done( () => {
							// clearInterval(this.renderCycle);
							this.loading = false;
							this.map.render();
							res();
						})
						.fail( () => rej );

					// oboe(location)
					// 	.node('location.coordinates', (coordinates: [[number, number]]) => {
					// 		this.webGl.settings.data.push(...coordinates.map(pair => [pair[1], pair[0]])); // have to flip our coordinates because leaflet and geojson dislike one another
					// 	})
					// 	.done( () => {
					// 		clearInterval(this.renderCycle);
					// 		this.loading = false;
					// 		res();
					// 	})
					// 	.fail( () => rej );
				})

			}
		},
		mounted() {
			const view: View = new View({
					projection: 'EPSG:3857',
					center: [0, 0],
					zoom: 13
				})
			this.map = new Map({
				target: 'map',
				interactions: defaults({dragPan: true, mouseWheelZoom: true}),				
				layers: [
					new TileLayer({
						source: new XYZ({
							url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
						})
					})
				],
				view
			});	

			const geolocation = new Geolocation({
				trackingOptions: {
					enableHighAccuracy: true
				},
				projection: view.getProjection(),
				tracking: true
			});

			geolocation.on('change', () => {
				view.setCenter(geolocation.getPosition());
			})
			// this.map = L.map('map',{
			// 	zoomControl: false,
			// 	preferCanvas: true,
			// 	renderer: L.canvas(),
			// 	crs: L.CRS.EPSG3857
			// });

			// this.map.setView([51.505, -0.09], 13);
			// this.map.locate({
			// 	setView: true,
			// 	maxZoom: 16,
			// 	enableHighAccuracy: true
			// });
			// L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
			// 	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
			// 	maxZoom: 22,
			// 	maxNativeZoom: 16
			// }).addTo(this.map);
			
			// this.buildWebGl();
			
			// this.map.on("zoomstart movestart", async() => {			
			// 	L.imageOverlay(this.webGl.canvas.toDataURL('image/webp', 1), this.map.getBounds())
			// 		.bindPopup(() => (this.$refs.popup as any).$el)
			// 		.addTo(this.map);
			// 	// this.webGl.clear();
			// });
		}
	})
</script>

<style lang="scss">
	.v-system-bar{
		position: absolute;
		width: 100vw;
		z-index: 99;
	}
	#map {
		height: 100vh;
		width: 100vw;
		z-index: 1;
	}
	.wrapper {
		height: 100vh;
		width: 100vw;		
		overflow: hidden;
	}
</style>