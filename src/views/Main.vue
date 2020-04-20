<template>
	<div>
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

				data.forEach((activity: any) => {
					const geo = {
							type: "Feature",
							geometry: {
								type: "Polygon",
								coordinates: activity.coordinates,
							}
						};
					console.log(geo);
					const webGL = L.glify.shapes({
						map: this.map,
						data: geo,
						click: function(){
							alert()
						},
						opacity: 0.85,
						preserveDrawingBuffer: true
					});
				})

				return data;
			}			
		},
		mounted() {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition((position) => {
					this.map.flyTo([position.coords.latitude, position.coords.longitude]);
				});
			}			
			this.map = L.map('map');
			this.map.setView([51.505, -0.09], 13);
			L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
				attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
				maxZoom: 16
			}).addTo(this.map);

			this.map.on("zoomend", () => {
				console.log(this.map.getBounds());
			});
			this.addPolyGLLayer();
		}
	})
</script>

<style lang="scss">
	#map {
		height: 100vh;
		width: 100vw;
	}
</style>