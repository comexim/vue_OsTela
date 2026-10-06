<template>
  <v-dialog v-model="isOpen" max-width="1200px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center bg-info pa-4">
        <div>
          <v-icon start color="white">mdi-compare</v-icon>
          <span class="text-white">Protheus X WMS - Comparação por Lote</span>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="closeModal"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Abas para separar Protheus e WMS -->
        <v-tabs v-model="tabAtiva" color="primary" class="mb-4">
          <v-tab value="protheus">
            <v-icon start>mdi-server</v-icon>
            Protheus ({{ dadosProtheus.length }})
          </v-tab>
          <v-tab value="wms">
            <v-icon start>mdi-warehouse</v-icon>
            WMS ({{ dadosWMS.length }})
          </v-tab>
          <v-tab value="comparacao">
            <v-icon start>mdi-compare-horizontal</v-icon>
            Comparação
          </v-tab>
        </v-tabs>

        <v-window v-model="tabAtiva">
          <!-- Aba Protheus -->
          <v-window-item value="protheus">
            <v-data-table
              :headers="headersProtheus"
              :items="dadosProtheus"
              :items-per-page="-1"
              class="elevation-1"
              density="comfortable"
              height="500"
              fixed-header
              hide-default-footer
            >
              <template #no-data>
                <div class="text-center pa-8">
                  <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
                  <h3 class="text-grey-darken-1 mb-2">Nenhum dado Protheus encontrado</h3>
                </div>
              </template>

              <template #[`item.SACAS`]="{ item }">
                <v-chip color="primary" size="small">
                  {{ formatNumber(item.SACAS) }}
                </v-chip>
              </template>

              <template #[`item.PESO`]="{ item }">
                <span class="font-weight-bold">{{ formatNumber(item.PESO) }} kg</span>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Aba WMS -->
          <v-window-item value="wms">
            <v-data-table
              :headers="headersWMS"
              :items="dadosWMS"
              :items-per-page="-1"
              class="elevation-1"
              density="comfortable"
              height="500"
              fixed-header
              hide-default-footer
            >
              <template #no-data>
                <div class="text-center pa-8">
                  <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
                  <h3 class="text-grey-darken-1 mb-2">Nenhum dado WMS encontrado</h3>
                </div>
              </template>

              <template #[`item.SACAS`]="{ item }">
                <v-chip color="success" size="small">
                  {{ formatNumber(item.SACAS) }}
                </v-chip>
              </template>

              <template #[`item.PESO`]="{ item }">
                <span class="font-weight-bold">{{ formatNumber(item.PESO) }} kg</span>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Aba Comparação -->
          <v-window-item value="comparacao">
            <v-data-table
              :headers="headersComparacao"
              :items="dadosComparacao"
              :items-per-page="-1"
              class="elevation-1"
              density="comfortable"
              height="500"
              fixed-header
              hide-default-footer
            >
              <template #no-data>
                <div class="text-center pa-8">
                  <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
                  <h3 class="text-grey-darken-1 mb-2">Nenhum dado para comparar</h3>
                </div>
              </template>

              <template #[`item.SACAS_PROTHEUS`]="{ item }">
                <v-chip color="primary" size="small">
                  {{ formatNumber(item.SACAS_PROTHEUS) }}
                </v-chip>
              </template>

              <template #[`item.SACAS_WMS`]="{ item }">
                <v-chip color="success" size="small">
                  {{ formatNumber(item.SACAS_WMS) }}
                </v-chip>
              </template>

              <template #[`item.DIFERENCA_SACAS`]="{ item }">
                <v-chip 
                  :color="item.DIFERENCA_SACAS === 0 ? 'grey' : item.DIFERENCA_SACAS > 0 ? 'error' : 'warning'" 
                  size="small"
                >
                  {{ item.DIFERENCA_SACAS > 0 ? '+' : '' }}{{ formatNumber(item.DIFERENCA_SACAS) }}
                </v-chip>
              </template>

              <template #[`item.PESO_PROTHEUS`]="{ item }">
                <span class="font-weight-bold">{{ formatNumber(item.PESO_PROTHEUS) }} kg</span>
              </template>

              <template #[`item.PESO_WMS`]="{ item }">
                <span class="font-weight-bold">{{ formatNumber(item.PESO_WMS) }} kg</span>
              </template>

              <template #[`item.DIFERENCA_PESO`]="{ item }">
                <v-chip 
                  :color="item.DIFERENCA_PESO === 0 ? 'grey' : item.DIFERENCA_PESO > 0 ? 'error' : 'warning'" 
                  size="small"
                >
                  {{ item.DIFERENCA_PESO > 0 ? '+' : '' }}{{ formatNumber(item.DIFERENCA_PESO) }} kg
                </v-chip>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn 
          color="green" 
          variant="elevated" 
          prepend-icon="mdi-file-excel"
          @click="exportarParaExcel"
        >
          Exportar Excel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="closeModal">
          Fechar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { exportToExcel } from '../../../utils/excelExport.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dadosProtheusWMS: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(props.modelValue);
const tabAtiva = ref('protheus');

// Separar dados entre Protheus e WMS
const dadosProtheus = computed(() => {
  return props.dadosProtheusWMS.filter(item => item.TIPO === 'PROT').map(item => ({
    ...item,
    SACAS: Math.round((parseFloat(item.PESO) || 0) / 59)
  }));
});

const dadosWMS = computed(() => {
  return props.dadosProtheusWMS.filter(item => item.TIPO === 'WMS').map(item => ({
    ...item,
    SACAS: Math.round((parseFloat(item.PESO) || 0) / 59)
  }));
});

// Criar dados de comparação agrupados por lote
const dadosComparacao = computed(() => {
  const lotes = new Map();

  // Agrupa dados Protheus por lote
  dadosProtheus.value.forEach(item => {
    if (!lotes.has(item.LOTE)) {
      lotes.set(item.LOTE, {
        LOTE: item.LOTE,
        SACAS_PROTHEUS: 0,
        PESO_PROTHEUS: 0,
        SACAS_WMS: 0,
        PESO_WMS: 0
      });
    }
    const lote = lotes.get(item.LOTE);
    const peso = parseFloat(item.PESO) || 0;
    lote.PESO_PROTHEUS += peso;
    lote.SACAS_PROTHEUS += Math.round(peso / 59);
  });

  // Agrupa dados WMS por lote
  dadosWMS.value.forEach(item => {
    if (!lotes.has(item.LOTE)) {
      lotes.set(item.LOTE, {
        LOTE: item.LOTE,
        SACAS_PROTHEUS: 0,
        PESO_PROTHEUS: 0,
        SACAS_WMS: 0,
        PESO_WMS: 0
      });
    }
    const lote = lotes.get(item.LOTE);
    const peso = parseFloat(item.PESO) || 0;
    lote.PESO_WMS += peso;
    lote.SACAS_WMS += Math.round(peso / 59);
  });

  // Calcula diferenças e converte para array
  return Array.from(lotes.values()).map(lote => ({
    ...lote,
    DIFERENCA_SACAS: lote.SACAS_PROTHEUS - lote.SACAS_WMS,
    DIFERENCA_PESO: lote.PESO_PROTHEUS - lote.PESO_WMS
  }));
});

// Definição das colunas para Protheus
const headersProtheus = [
  { title: 'Lote', key: 'LOTE', align: 'center', sortable: true },
  { title: 'Sacas', key: 'SACAS', align: 'center', sortable: true },
  { title: 'Peso', key: 'PESO', align: 'center', sortable: true }
];

// Definição das colunas para WMS
const headersWMS = [
  { title: 'Lote', key: 'LOTE', align: 'center', sortable: true },
  { title: 'Sacas', key: 'SACAS', align: 'center', sortable: true },
  { title: 'Peso', key: 'PESO', align: 'center', sortable: true }
];

// Definição das colunas para Comparação
const headersComparacao = [
  { title: 'Lote', key: 'LOTE', align: 'center', sortable: true },
  { title: 'Sacas Protheus', key: 'SACAS_PROTHEUS', align: 'center', sortable: true },
  { title: 'Sacas WMS', key: 'SACAS_WMS', align: 'center', sortable: true },
  { title: 'Diferença Sacas', key: 'DIFERENCA_SACAS', align: 'center', sortable: true },
  { title: 'Peso Protheus', key: 'PESO_PROTHEUS', align: 'center', sortable: true },
  { title: 'Peso WMS', key: 'PESO_WMS', align: 'center', sortable: true },
  { title: 'Diferença Peso', key: 'DIFERENCA_PESO', align: 'center', sortable: true }
];

// Função para formatar números
const formatNumber = (value) => {
  if (value == null || value === '') return '0';
  return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
});

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
  if (!newValue) {
    tabAtiva.value = 'protheus'; // Reset para primeira aba ao fechar
  }
});

const exportarParaExcel = () => {
  const sheets = [
    {
      name: 'Protheus',
      data: dadosProtheus.value,
      headers: headersProtheus
    },
    {
      name: 'WMS',
      data: dadosWMS.value,
      headers: headersWMS
    },
    {
      name: 'Comparação',
      data: dadosComparacao.value,
      headers: headersComparacao
    }
  ];

  exportToExcel(sheets, 'Protheus_X_WMS');
};

const closeModal = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.bg-info {
  background: linear-gradient(135deg, #0288d1 0%, #03a9f4 100%);
}

.v-data-table {
  border-radius: 8px;
}

.v-card {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.v-card-title {
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.v-card-text {
  flex: 1;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
}

.v-card-actions {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: white;
  flex-shrink: 0;
}
</style>
