<template>
  <v-app>
    <v-app-bar app color="white" light>
      <div class="d-flex align-center">
        <v-img
          alt="Cheater Checker Logo"
          class="shrink"
          contain
          src="/img/logo.png"
          transition="scale-transition"
          height="48"
        />
      </div>

      <v-spacer></v-spacer>

    </v-app-bar>

    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "App",

  data: () => ({
    //
  })
});
</script>
