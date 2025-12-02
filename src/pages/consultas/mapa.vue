<template>
		<!--<Filtro @filtrado="handleFiltrado"/>-->
		<mapView :filteredEnderCods="filteredEnderCods" :wmsOpen="wmsOpen"/>
		<CensoArmazem title="Censo do Armazem" content="Conteúdo do armazém" />
		<censoSilos />
		<silos />
		
		<!-- Tabela de resultados fixa no canto superior direito -->
		<v-card 
			v-if="tableData.show" 
			class="pa-4 elevation-8" 
			style="position: fixed; top: 60px; right: 20px; min-width: 400px; max-height: 400px; z-index: 1000; background-color: white; overflow-y: auto;"
		>
			<v-card-title class="d-flex justify-space-between align-center">
				<span>Endereços Filtrados{{ tableData.temCheckbox ? '' : ' | Sacas: ' + tableData.totalSacas.toFixed(2) }}</span>
				<v-btn icon size="small" @click="toggleTableMinimized">
					<v-icon>{{ tableData.minimized ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
				</v-btn>
			</v-card-title>
			<v-card-text v-if="!tableData.minimized">
				<v-data-table
					:headers="tableHeaders"
					:items="tableData.data"
					item-key="enderCod"
					class="elevation-1"
					density="compact"
					hide-default-footer
					:items-per-page="-1"
				>
				</v-data-table>
			</v-card-text>
		</v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Filtro from '../consultas/components/filtro.vue';
import mapView from '../consultas/components/mapView.vue';
import CensoArmazem from '../consultas/components/censoarmazem.vue';
import censoSilos from './components/censoSilos.vue';
import silos from './components/silos.vue';

const filteredEnderCods = ref([]);
const wmsOpen = ref(false);

// Variável para controlar se já foi feito o reload
const hasReloaded = ref(false);

// Estados para controle da tabela
const tableData = ref({
	show: false,
	minimized: false,
	data: [],
	totalSacas: 0,
	temCheckbox: false
});

const tableHeaders = [
	{ title: 'Endereços', key: 'enderCod' },
	{ title: 'Lote', key: 'bagLote' }
];

function handleFiltrado(enderCodList) {
	filteredEnderCods.value = enderCodList;
}

// Função para lidar com filtrado do WMS
function handleWMSFiltrado(event) {
	const enderCodList = event.detail.enderCods;
	filteredEnderCods.value = enderCodList;
}

// Função para lidar com abertura/fechamento do WMS
function handleWMSToggle(event) {
	wmsOpen.value = event.detail.isOpen;
}

// Função para lidar com atualização da tabela
function handleUpdateTable(event) {
	tableData.value = event.detail;
}

// Função para minimizar/expandir a tabela
const toggleTableMinimized = () => {
	tableData.value.minimized = !tableData.value.minimized;
};

onMounted(() => {
	// Força reload da página ao montar o componente (apenas uma vez)
	if (!sessionStorage.getItem('mapaReloaded')) {
		sessionStorage.setItem('mapaReloaded', 'true');
		window.location.reload();
		return;
	}
	
	// Escutar eventos globais do WMS
	window.addEventListener('wms-filtrado', handleWMSFiltrado);
	window.addEventListener('wms-toggle', handleWMSToggle);
	window.addEventListener('wms-update-table', handleUpdateTable);
});

onUnmounted(() => {
	// Limpar o flag quando sair da página
	sessionStorage.removeItem('mapaReloaded');
	
	// Remover listener quando o componente for desmontado
	window.removeEventListener('wms-filtrado', handleWMSFiltrado);
	window.removeEventListener('wms-toggle', handleWMSToggle);
	window.removeEventListener('wms-update-table', handleUpdateTable);
});
</script>

<style scoped>
</style>
