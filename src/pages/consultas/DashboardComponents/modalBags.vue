<template>
  <v-dialog v-model="isOpen" max-width="1200px" persistent>
    <v-card>
      <v-card-text class="pa-0">
        <v-tabs v-model="currentTab" bg-color="blue-grey-lighten-5" color="primary" align-tabs="center">
          <v-tab value="transito">
            <v-icon start>mdi-truck-delivery</v-icon>
            Em Trânsito
          </v-tab>
          <v-tab value="vazios">
            <v-icon start>mdi-bag-checked</v-icon>
            Depositados Vazios
          </v-tab>
          <v-tab value="duplicidade">
            <v-icon start>mdi-content-duplicate</v-icon>
            Em Duplicidade
          </v-tab>
          <v-tab value="corte">
            <v-icon start>mdi-content-cut</v-icon>
            Em Corte
          </v-tab>
          <v-tab value="embegadora">
            <v-icon start>mdi-package-variant-closed</v-icon>
            Na Embegadora
          </v-tab>
          <v-btn icon="mdi-close" variant="text" class="ml-auto" @click="closeModal"></v-btn>
        </v-tabs>

        <v-window v-model="currentTab">
          <v-window-item value="transito">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="itemsTransito"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="vazios">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="itemsVazios"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="duplicidade">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="itemsDuplicidade"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="corte">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="itemsCorte"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="embegadora">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="itemsEmbegadora"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="pa-4">
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  initialTab: {
    type: String,
    default: 'transito',
    validator: (value) => ['transito', 'vazios', 'duplicidade', 'corte', 'embegadora'].includes(value)
  },
  bagData: {
    type: Object,
    default: () => ({
      Transito: [],
      Embarcadas: [],
      Cortes: [],
      Vazios: [],
      Duplicados: []
    })
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(props.modelValue);
const currentTab = ref(props.initialTab);

// Definição das colunas da tabela
const tableHeaders = [
  { title: 'Tag', key: 'tag', align: 'start', sortable: true },
  { title: 'Endereço', key: 'endereco', align: 'center', sortable: true },
  { title: 'Lote', key: 'lote', align: 'center', sortable: true }
];

// Bags em trânsito
const itemsTransito = computed(() => {
  return (props.bagData.Transito || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote
  }));
});

// Bags depositados vazios
const itemsVazios = computed(() => {
  return (props.bagData.Vazios || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote
  }));
});

// Bags em duplicidade
const itemsDuplicidade = computed(() => {
  return (props.bagData.Duplicados || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote
  }));
});

// Bags em corte
const itemsCorte = computed(() => {
  return (props.bagData.Cortes || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote
  }));
});

// Bags na embegadora
const itemsEmbegadora = computed(() => {
  return (props.bagData.Embarcadas || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote
  }));
});

watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue;
});

watch(() => props.initialTab, (newValue) => {
  currentTab.value = newValue;
});

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue);
});

const closeModal = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.bg-primary {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
}

.v-window {
  min-height: 500px;
  max-height: 500px;
}

.v-data-table {
  height: 450px;
  overflow-y: auto;
}
</style>