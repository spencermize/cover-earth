  
<template>
  <div class="text-center">
    <v-overlay :value="true">
		<v-progress-circular
		indeterminate
		color="red"
		></v-progress-circular>
    </v-overlay>
  </div>
</template>

<style lang="scss">

</style>
<script lang="ts">
	import Vue from 'vue';
	export default Vue.extend({
		name: 'Loading'
	});
</script>