<template>
	<v-container fluid class="white-background rounded-xl elevation-8 mt-4">
		<!-- Título principal -->
		<v-row>
			<v-col cols="12">
				<div class="text-left">
					<h1 class="text-h5 font-weight-bold text-primary">
					    Silos
					</h1>
					<v-divider class="mx-auto" style="max-width: 100vw;"></v-divider>
				</div>
			</v-col>
		</v-row>
		
		<!-- Cards dos silos -->
		<v-row>
			<v-col v-for="(item, index) in silosApp" :key="index" cols="12" md="3" lg="3">
				<v-card color="primary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="pa-4">
						<div class="d-flex align-center mb-3">
							<v-avatar color="primary" size="40" class="me-3">
								<v-icon icon="mdi-silo-outline" size="24" color="white"></v-icon>
							</v-avatar>
							<div>
								<div class="text-h6 font-weight-bold text-black text-left">
									{{ item.siloCod }}
								</div>
								<div class="text-body-2 text-grey-darken-2">
									{{ item.siloSetor }}
								</div>
							</div>
						</div>
						
						<div class="mb-2">
							<div class="d-flex justify-space-between text-bold text-black mb-0">
								<span><strong>Lote:</strong> {{ item.siloLote }}</span>
								<span><strong>Capacidade:</strong> {{ item.siloCapac }}</span>
							</div>
							<div class="d-flex justify-space-between text-bold text-black mb-1">
                                <span><strong>Saldo:</strong> {{ item.siloSaldo }}</span>
								<span><strong>Sacas:</strong> {{ item.siloSaca }}</span>
							</div>
						</div>

						<!-- Barra de progresso -->
						<div class="mb-2">
							<div class="d-flex justify-space-between text-body-2 text-black mb-1">
								<span>Ocupação:</span>
								<span>{{ item.siloPercOcup }}%</span>
							</div>
							<v-progress-linear
								:model-value="parseInt(item.siloPercOcup)"
								color="secondary"
								height="12"
								rounded
							></v-progress-linear>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
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

	async function loadSiloApp() {
		const response = await siloAppStore.siloApp();
		silosApp.value = response.listaSilos; // Coloca o objeto dentro de um array
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