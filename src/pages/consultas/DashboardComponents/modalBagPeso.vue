<template>
  <v-dialog v-model="isOpen" max-width="900px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center bg-warning pa-4">
        <div>
          <v-icon start color="white">mdi-weight</v-icon>
          <span class="text-white">Bags com menos de 800kg</span>
        </div>
        <v-btn icon="mdi-close" variant="text" color="white" @click="closeModal"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-data-table
          :headers="tableHeaders"
          :items="bagsPeso"
          :items-per-page="-1"
          class="elevation-1"
          density="comfortable"
          hide-default-footer
        >
          <template v-slot:no-data>
            <div class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
              <h3 class="text-grey-darken-1 mb-2">Nenhum bag encontrado</h3>
            </div>
          </template>

          <template v-slot:item.PESO="{ item }">
            <v-chip color="warning" size="small">
              {{ item.PESO }} kg
            </v-chip>
          </template>
        </v-data-table>
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
import { ref, watch } from 'vue';
import { exportSingleSheet } from '../../../utils/excelExport.js';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  bagsPeso: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(props.modelValue);

// Definição das colunas da tabela
const tableHeaders = [
  { title: 'Endereço', key: 'ENDERECO', align: 'center', sortable: true },
  { title: 'TAG', key: 'TAG', align: 'center', sortable: true },
  { title: 'Lote', key: 'LOTE', align: 'center', sortable: true },
  { title: 'Peso (kg)', key: 'PESO', align: 'center', sortable: true },
  { title: 'Sacas', key: 'SACAS', align: 'center', sortable: true }
];

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
});

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const exportarParaExcel = () => {
  exportSingleSheet(props.bagsPeso, tableHeaders, 'Bags_Menos_800kg');
};

const closeModal = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.bg-warning {
  background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%);
}

.v-data-table {
  max-height: 500px;
  overflow-y: auto;
}
</style>
