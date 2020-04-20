<template>
	<div class="wrapper">
		<v-system-bar :lights-out="true">
			<v-spacer></v-spacer>
			<v-icon v-on:click="$emit('login-change', false)">mdi-logout-variant</v-icon>
		</v-system-bar>
		<div id="map"></div>	
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import * as L from 'leaflet'; 
	import glify from 'leaflet.glify';

	export default Vue.extend({
		name: 'Main',
		props: {
			user: String,
		},
		data()  { 
			return {
				map: {} as L.Map
			}
		},
		methods: {
			addPolyGLLayer: async function(){
				const resp = await fetch('/api/locations/strava');
				const data = await resp.json();
				const points: [[number, number]?] = [];
				data.forEach((activity: any) => {
					// const geo = {
					// 	type: "Feature",
					// 	properties: {
					// 	},
					// 	geometry: {
					// 		type: "Polygon",
					// 		coordinates: activity.location.coordinates,
					// 	}

					// };
					points.push(...activity.location.coordinates[0]);
					delete activity.location.coordinates;
				})
				const webGL = glify.points({
					map: this.map,
					size: 5,
					color: () => { return {r: 92/255, g: 65/255, b:93/255} },
					opacity: 1,
					data: points,
					click: (e: Event, feature: any) =>{
						console.log(feature);
					}
				});
				return data;
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
			this.addPolyGLLayer();
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