<template>
		<Filtro @filtrado="handleFiltrado"/>
		<mapView :filteredEnderCods="filteredEnderCods"/>
		<CensoArmazem title="Censo do Armazem" content="Conteúdo do armazém" />
		<censoSilos />
		<silos />
</template>

<script setup>
import { ref } from 'vue';
import BasePage from '@/components/BasePage.vue';
import Filtro from '../consultas/components/filtro.vue';
import mapView from '../consultas/components/mapView.vue';
import CensoArmazem from '../consultas/components/censoarmazem.vue';
import censoSilos from './components/censoSilos.vue';
import silos from './components/silos.vue';

const filteredEnderCods = ref([]);

function handleFiltrado(enderCodList) {
	filteredEnderCods.value = enderCodList;
}
</script>

<style scoped>
</style>
