<template>
	<v-container fluid class="white-background rounded-xl elevation-8">
		<!-- Título principal -->
		<v-row>
			<v-col cols="12">
				<div class="text-left">
					<h1 class="text-h5 font-weight-bold text-primary">
						Censo dos Silos
					</h1>
					<v-divider class="mx-auto" style="max-width: 100vw;"></v-divider>
				</div>
			</v-col>
		</v-row>
		
		<!-- Cards de totais -->
		<v-row>
			<v-col cols="15" md="3">
				<v-card color="primary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="primary" size="40" class="me-3">
							<v-icon icon="mdi-warehouse" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ capTotalKg }}
							</div>
							<div class="text-body-2 text-black">
								Capacidade total - KG
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
			
			<v-col cols="15" md="3">
				<v-card color="secondary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="secondary" size="40" class="me-3">
							<v-icon icon="mdi-package-variant" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ capTotalSc }}
							</div>
							<div class="text-body-2 text-black">
								Capacidade total - Sacas
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>

            <v-col cols="15" md="3">
				<v-card color="secondary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="secondary" size="40" class="me-3">
							<v-icon icon="mdi-barrel" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ capOcupKg }}
							</div>
							<div class="text-body-2 text-black">
								Capacidade ocupada - KG
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>

            <v-col cols="15" md="3">
				<v-card color="secondary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="secondary" size="40" class="me-3">
							<v-icon icon="mdi-package" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ capOcupSc }}
							</div>
							<div class="text-body-2 text-black">
								Capacidade ocupada - Sacas
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>

            <v-col cols="15" md="3">
				<v-card color="secondary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="secondary" size="40" class="me-3">
							<v-icon icon="mdi-chart-bar" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ percOcup }}%
							</div>
							<div class="text-body-2 text-black">
								Porcentual ocupado
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<!-- Cards de estatísticas -->
		<v-row>
			
		</v-row>
	</v-container>
</template>

<script setup>
import { siloApp } from '../../../stores/Consultas/getSiloApp';
import { ref, onMounted, computed } from 'vue';

defineProps({
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	}
});
//Estados
	const siloAppStore = siloApp();
	const silosApp = ref([]);

    // Computeds para mostrar os dados do silo
    const capTotalKg = computed(() => silosApp.value[0]?.capTotalKg || '');
    const capTotalSc = computed(() => silosApp.value[0]?.capTotalSc || '');
    const capOcupKg = computed(() => silosApp.value[0]?.capOcupKg || '');
    const capOcupSc = computed(() => silosApp.value[0]?.capOcupSc || '');
    const percOcup = computed(() => silosApp.value[0]?.percOcup || '');

	async function loadSiloApp() {
		const response = await siloAppStore.siloApp();
		silosApp.value = [response]; // Coloca o objeto dentro de um array
	}

	onMounted(() => {
		loadSiloApp();
	})


</script>

<style scoped>
.v-card {
	transition: all 0.3s ease;
	border-radius: 16px;
}

.v-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.v-avatar {
	transition: all 0.3s ease;
}

.v-card:hover .v-avatar {
	transform: scale(1.1);
}

.text-h4 {
	text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.v-progress-linear {
	border-radius: 8px;
}

.white-background {
	background-color: white !important;
}
</style>