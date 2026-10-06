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
				<span>
					Endereços Filtrados
					<template v-if="!tableData.temCheckbox">
						| <span class="sacas-total">Sacas: <span class="sacas-total-value">{{ formatBrazilianNumber(tableData.totalSacas) }}</span></span>
					</template>
				</span>
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
					<template v-slot:header.siloSaca="{ column }">
						<span class="sacas-table-header">{{ column.title }}</span>
					</template>
					<template v-slot:item.siloSaca="{ item }">
						<span class="sacas-table-value">{{ item.siloSaca !== undefined && item.siloSaca !== null ? formatBrazilianNumber(item.siloSaca) : '-' }}</span>
					</template>
				</v-data-table>
			</v-card-text>
		</v-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import mapView from '../consultas/components/mapView.vue';
import CensoArmazem from '../consultas/components/censoarmazem.vue';
import censoSilos from './components/censoSilos.vue';
import silos from './components/silos.vue';
import { formatBrazilianNumber } from '../../utils/numberFormat';

const filteredEnderCods = ref([]);
const wmsOpen = ref(false);

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
	{ title: 'Sacas', key: 'siloSaca' },
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
	// Escutar eventos globais do WMS
	window.addEventListener('wms-filtrado', handleWMSFiltrado);
	window.addEventListener('wms-toggle', handleWMSToggle);
	window.addEventListener('wms-update-table', handleUpdateTable);
});

onUnmounted(() => {
	// Remover listener quando o componente for desmontado
	window.removeEventListener('wms-filtrado', handleWMSFiltrado);
	window.removeEventListener('wms-toggle', handleWMSToggle);
	window.removeEventListener('wms-update-table', handleUpdateTable);
});
</script>

<style scoped>
.sacas-total {
	font-size: 1.25rem;
	font-weight: 400;
}

.sacas-total-value {
	font-size: 1.35rem;
	font-weight: 400;
}

.sacas-table-header {
	font-size: 1.05rem;
	font-weight: 400;
}

.sacas-table-value {
	font-size: 1.2rem;
	font-weight: 400;
}
</style>
