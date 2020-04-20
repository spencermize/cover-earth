<template>
  <v-app>
    <v-content>
		<router-view v-on:login-change="onLoginChange" v-bind:login="login"></router-view>
		<loading v-if="loading"></loading>
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
			loading: false
		}
	},
	methods: {
		onLoginChange: async function(login: boolean) {
			this.loading = true;
			if(!login) {
				const request = await fetch('/auth/logout');
				const json = await request.json();
				if ( json.success ) {
					this.loading = false;
					this.$router.replace('/login');
				}
			}
		},
		
	}
});
</script>
