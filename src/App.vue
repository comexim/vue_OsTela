<template>
  <v-app>
    <Navbar v-if="!isLoginPage" />
    <v-main :style="mainStyle">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';

const route = useRoute();

// Verifica se está na página de login
const isLoginPage = computed(() => {
  return route.path === '/';
});

// Estilo para não comprimir o conteúdo quando a navbar abre
const mainStyle = computed(() => {
  return {
    marginLeft: '0 !important',
    paddingLeft: '0 !important',
    width: '100%',
    overflow: 'visible'
  };
});
</script>

<style lang="scss">
:root {
  --primary: #4ade80;
  --grey: #64748b;
  --dark: #1e293b;
  --dark-alt: #334155;
  --light: #f1f5f9;
  --sidebar-width: 300px;
}

*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Fire sans', sans-serif;
}

body {
  background: var(--light);
}

button {
  cursor: pointer;
  appearance: none;
  border: none;
  outline: none;
  background: none;
}

.app {
  display: flex;
  
  main {
    flex: 1 1 0;
    padding: 2rem;

    @media (max-width: 768px) {
      padding-left: 6rem;
    }
  }
}
</style>
