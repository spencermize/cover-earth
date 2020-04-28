<template>
	<div class="wrapper">
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
	import turf from '@turf/helpers';

	export default Vue.extend({
		name: 'Main',
		components: { Loading },
		props: {
			user: String,
		},
		data()  { 
			return {
				map: {} as L.Map,
				message: "" as string,
				loading: false as boolean,
				webGl: {} as any,
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
				this.startRender();				
				await this.loadPoints(`/api/locations/strava/${this.map.getBounds().toBBoxString()}`);
				// this.map.setZoom(zoom);
			},	

			mapAll: async function(){
				this.loadPoints('/api/locations/strava');
				this.startRender();
			},

			loadPoints: function(location: string) {
				return new Promise( (res, rej) => {
					this.loading = true;
					oboe(location)
						.node('location.coordinates', (coordinates: [[number, number]]) => {
							this.webGl.settings.data.push(...coordinates.map(pair => [pair[1], pair[0]])); // have to flip our coordinates because leaflet and geojson dislike one another
						})
						.done( () => {
							clearInterval(this.renderCycle);
							this.loading = false;
							res();
						})
						.fail( () => rej );
				})

			}
		},
		mounted() {
			this.map = L.map('map',{
				zoomControl: false,
				preferCanvas: true,
				renderer: L.canvas(),
				crs: L.CRS.EPSG3857
			});

			this.map.setView([51.505, -0.09], 13);
			this.map.locate({
				setView: true,
				maxZoom: 16,
				enableHighAccuracy: true
			});
			L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
				attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
				maxZoom: 22,
				maxNativeZoom: 16
			}).addTo(this.map);
			
			this.buildWebGl();
			
			this.map.on("zoomstart movestart", async() => {			
				L.imageOverlay(this.webGl.canvas.toDataURL('image/webp', 1), this.map.getBounds())
					.bindPopup(() => (this.$refs.popup as any).$el)
					.addTo(this.map);
				// this.webGl.clear();
			});
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