<template>
	<v-container fluid class="white-background rounded-xl elevation-8 mb-4">
		<!-- Título principal -->
		<v-row class="mb-1">
			<v-col cols="12">
				<div class="text-left">
					<h1 class="text-h5 font-weight-bold text-primary">
						Censo do Armazém
					</h1>
					<v-divider class="mx-auto" style="max-width: 100vw;"></v-divider>
				</div>
			</v-col>
		</v-row>
		
		<!-- Cards de totais -->
		<v-row class="mb-1">
			<v-col cols="12" md="3">
				<v-card color="primary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="primary" size="40" class="me-3">
							<v-icon icon="mdi-sigma" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ totalEnderecos }}
							</div>
							<div class="text-body-2 text-black">
								Total de Endereços
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
			
			<v-col cols="12" md="3">
				<v-card color="secondary" variant="tonal" class="elevation-4" hover>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar color="secondary" size="40" class="me-3">
							<v-icon icon="mdi-sack" size="24" color="white"></v-icon>
						</v-avatar>
						<div>
							<div class="text-h5 font-weight-bold text-black">
								{{ totalSacas }}
							</div>
							<div class="text-body-2 text-black">
								Total de Sacas
							</div>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<!-- Cards de estatísticas -->
		<v-row>
			<v-col cols="12" sm="6" md="3" v-for="stat in stats" :key="stat.title">
				<v-card 
					:color="stat.color" 
					:variant="stat.variant"
					class="elevation-4"
					hover
				>
					<v-card-text class="d-flex align-center pa-4">
						<v-avatar 
							:color="stat.iconColor" 
							size="40" 
							class="me-3"
						>
							<v-icon 
								:icon="stat.icon" 
								size="24" 
								color="white"
							></v-icon>
						</v-avatar>
						
						<div class="flex-grow-1">
							<div class="text-h5 font-weight-bold text-black" :style="{ color: stat.textColor }">
								{{ stat.count }}
							</div>
							<div class="text-body-2 font-weight-medium text-black" :style="{ color: stat.textColor }">
								{{ stat.title }}
							</div>
							
							<v-progress-linear
								:model-value="getPercentage(stat.count)"
								:color="stat.progressColor"
								height="4"
								class="mt-2"
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
import { enderColor } from '../../../stores/Consultas/getEnderColor';
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
	const enderColorStore = enderColor();
	const enderColors = ref([]);

	async function loadEnderColor() {
		const response = await enderColorStore.enderColor();
		enderColors.value = response.map(item => ({
			code: item.enderCod,
			status: item.enderStatus,
			sacas: item.enderSacas
		}))
	}

	onMounted(() => {
		loadEnderColor();
	})

	const countLivre = computed(() => {
        return enderColors.value.filter(item =>
			item.status === "LV" && !["B","D","L","M"].includes(item.code.charAt(0))
			).length;
	});

	const countOcupada = computed(() => {
  		return enderColors.value.filter(item => item.status === "OC").length;
	});

	const countBloqueada = computed(() => {
  		return enderColors.value.filter(item => item.status === "BQ").length;
	});

	const countEmpenhada = computed(() => {
  		return enderColors.value.filter(item => item.status === "EM").length;
	});

	// Totais gerais
	const totalEnderecos = computed(() => {
		return enderColors.value.length;
	});

	const totalSacas = computed(() => {
		return enderColors.value.reduce((total, item) => {
			return total + (parseInt(item.sacas) || 0);
		}, 0);
	});

	// Dados para os cards de estatísticas
	const stats = computed(() => [
		{
			title: 'Livres',
			count: countLivre.value,
			icon: 'mdi-warehouse',
			color: 'success',
			variant: 'tonal',
			iconColor: 'success',
			textColor: '#2e7d32',
			progressColor: 'success'
		},
		{
			title: 'Ocupadas',
			count: countOcupada.value,
			icon: 'mdi-package-variant-closed',
			color: 'warning',
			variant: 'tonal',
			iconColor: 'warning',
			textColor: '#f57c00',
			progressColor: 'warning'
		},
		{
			title: 'Bloqueadas',
			count: countBloqueada.value,
			icon: 'mdi-lock',
			color: 'error',
			variant: 'tonal',
			iconColor: 'error',
			textColor: '#d32f2f',
			progressColor: 'error'
		},
		{
			title: 'Empenhadas',
			count: countEmpenhada.value,
			icon: 'mdi-clock-outline',
			color: 'info',
			variant: 'tonal',
			iconColor: 'info',
			textColor: '#1976d2',
			progressColor: 'info'
		}
	]);

	// Calcula a porcentagem para a barra de progresso
	const getPercentage = (count) => {
		const total = countLivre.value + countOcupada.value + countBloqueada.value + countEmpenhada.value;
		return total > 0 ? (count / total) * 100 : 0;
	};


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

.margin {
	margin-bottom: -1600px;
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