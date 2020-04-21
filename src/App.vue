<template>
  <v-app>
    <v-content>
		<router-view v-on:login-change="onLoginChange" v-bind:login="login"></router-view>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
	name: "App",
	data: () => {
		return {
			login: false as boolean,
		}
	},
	methods: {
		onLoginChange: async function(login: boolean) {
			if(!login) {
				const request = await fetch('/auth/logout');
				const json = await request.json();
				if ( json.success ) {
					this.$router.replace('/login');
				}
			}
		},
		
	}
});
</script>
