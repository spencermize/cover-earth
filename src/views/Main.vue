<template>
	<div class="wrapper">
		<v-system-bar :lights-out="true">
			<v-spacer></v-spacer>
			<v-icon v-on:click="sync()">mdi-database-refresh</v-icon>
			<v-icon v-on:click="addPolyGLLayer()">mdi-star-four-points-outline</v-icon>
			<v-icon v-on:click="$emit('login-change', false)">mdi-logout-variant</v-icon>
		</v-system-bar>
		<div id="map"></div>	

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
				loading: false as boolean
			}
		},
		methods: {
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
			addPolyGLLayer: async function(){
				// const resp = await fetch('/api/locations/strava');
				// const data = await resp.json();
				const points: [[number, number]?] = [];
				const webGl = glify.points({
					map: this.map,
					size: 5,
					color: {r: 92/255, g: 65/255, b:93/255},
					opacity: 1,
					data: points,
					click: (e: Event, feature: any) =>{
						console.log(feature);
					}
				});	
				
				let lastCount = 0;
				let missedCycles = 0;
				const renderCycle = setInterval(() => {
					if (webGl.settings.data.length && webGl.settings.data.length != lastCount){
						console.log('rendering');
						lastCount = webGl.settings.data.length;
						try{
						webGl.render();						
						} catch(e){
							console.log(webGl.settings.data);
							clearInterval(renderCycle);
						}
					} else {
						console.log(webGl.settings.data.length)
						missedCycles++;
						if (lastCount && missedCycles > 5) {
							clearInterval(renderCycle);
						}
					}
				}, 3000);

				oboe('/api/locations/strava')
					.node('location.coordinates', (coordinates: [[number, number]]) => {
						webGl.settings.data.push(...coordinates.map(pair => [pair[1], pair[0]])); // have to flip our coordinates because leaflet and geojson dislike one another
						// console.log(webGl.settings.data);
					})
			}			
		},
		mounted() {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition((position) => {
					this.map.setView([position.coords.latitude, position.coords.longitude], 13);
				});
			}			
			this.map = L.map('map',{
				zoomControl: false
			});
			this.map.setView([51.505, -0.09], 13);
			L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
				attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
				maxZoom: 22,
				maxNativeZoom: 16
			}).addTo(this.map);

			this.map.on("zoomend", () => {
				console.log(this.map.getBounds());
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