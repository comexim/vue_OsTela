<template>
  <v-dialog v-model="isOpen" max-width="1200px" persistent>
    <v-card>
      <v-card-text class="pa-0">
        <v-tabs v-model="currentTab" bg-color="blue-grey-lighten-5" color="primary" align-tabs="center">
          <v-tab value="livres">
            <v-icon start>mdi-bag-checked</v-icon>
            Bags Livres
          </v-tab>
          <v-tab value="depositados">
            <v-icon start>mdi-package-variant</v-icon>
            Bags Depositados
          </v-tab>
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
          <v-tab value="invalidas">
            <v-icon start>mdi-alert-circle</v-icon>
            Posição Inválida
          </v-tab>
        </v-tabs>

        <v-window v-model="currentTab">
          <v-window-item value="livres">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersLivres"
                :items="itemsLivres"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="depositados">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersDepositadosTransito"
                :items="itemsDepositados"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="transito">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersDepositadosTransito"
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

          <v-window-item value="invalidas">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersInvalidas"
                :items="itemsInvalidas"
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
  initialTab: {
    type: String,
    default: 'transito',
    validator: (value) => ['livres', 'transito', 'vazios', 'duplicidade', 'corte', 'embegadora', 'depositados', 'invalidas'].includes(value)
  },
  bagData: {
    type: Object,
    default: () => ({
      Depositadas: [],
      Transito: [],
      Embarcadas: [],
      Cortes: [],
      Vazios: [],
      Duplicados: [],
      BagsLV: [],
      PosInvalidas: []
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

// Headers para bags livres (apenas Tag)
const tableHeadersLivres = [
  { title: 'Tag', key: 'tag', align: 'start', sortable: true }
];

const tableHeadersDepositadosTransito = [
  { title: 'Tag', key: 'tag', align: 'start', sortable: true },
  { title: 'Endereço', key: 'endereco', align: 'center', sortable: true },
  { title: 'Lote', key: 'lote', align: 'center', sortable: true },
  { title: 'Peso', key: 'peso', align: 'center', sortable: true },
  { title: 'Sacas', key: 'sacas', align: 'center', sortable: true }
];

// Headers para posições inválidas
const tableHeadersInvalidas = [
  { title: 'Endereço', key: 'endereco', align: 'start', sortable: true },
  { title: 'Nível A', key: 'nivelA', align: 'center', sortable: true },
  { title: 'Nível B', key: 'nivelB', align: 'center', sortable: true },
  { title: 'Nível C', key: 'nivelC', align: 'center', sortable: true },
  { title: 'Nível D', key: 'nivelD', align: 'center', sortable: true }
];

// Bags livres
const itemsLivres = computed(() => {
  return (props.bagData.BagsLV || []).map(item => ({
    tag: item.BagTag
  }));
});

// Bags depositados
const itemsDepositados = computed(() => {
  return (props.bagData.Depositadas || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote,
    peso: item.BagPeso,
    sacas: item.BagSacas
  }));
});

// Bags em trânsito
const itemsTransito = computed(() => {
  return (props.bagData.Transito || []).map(item => ({
    tag: item.BagTag,
    endereco: item.Endereco,
    lote: item.BagLote,
    peso: item.BagPeso,
    sacas: item.BagSacas
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

// Função auxiliar para extrair o prefixo do endereço (sem a última letra)
const getEnderecoPrefixo = (enderCod) => {
  if (!enderCod || enderCod.length < 2) return enderCod;
  return enderCod.slice(0, -1);
};

// Função para obter o valor de uma posição (lote + tag do bag)
const getBagInfo = (bags, subEndereco) => {
  const bag = bags.find(b => b.Endereco === subEndereco);
  return bag ? `${bag.BagLote} (${bag.BagTag})` : '';
};

// Bags com posição inválida - agrupado por endereço
const itemsInvalidas = computed(() => {
  const grupos = {};
  
  // Agrupa bags por prefixo de endereço
  (props.bagData.PosInvalidas || []).forEach(item => {
    const prefixo = getEnderecoPrefixo(item.Endereco);
    if (!grupos[prefixo]) {
      grupos[prefixo] = [];
    }
    grupos[prefixo].push(item);
  });
  
  // Cria as linhas da tabela
  const result = [];
  Object.entries(grupos).forEach(([prefixo, bags]) => {
    result.push({
      endereco: prefixo,
      nivelA: getBagInfo(bags, `${prefixo}A`),
      nivelB: getBagInfo(bags, `${prefixo}B`),
      nivelC: getBagInfo(bags, `${prefixo}C`),
      nivelD: getBagInfo(bags, `${prefixo}D`)
    });
  });
  
  // Ordena por endereço
  result.sort((a, b) => a.endereco.localeCompare(b.endereco));
  
  return result;
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

const exportarParaExcel = () => {
  const sheets = [
    {
      name: 'Bags Livres',
      data: itemsLivres.value,
      headers: tableHeadersLivres
    },
    {
      name: 'Bags Depositados',
      data: itemsDepositados.value,
      headers: tableHeadersDepositadosTransito
    },
    {
      name: 'Em Trânsito',
      data: itemsTransito.value,
      headers: tableHeadersDepositadosTransito
    },
    {
      name: 'Depositados Vazios',
      data: itemsVazios.value,
      headers: tableHeaders
    },
    {
      name: 'Em Duplicidade',
      data: itemsDuplicidade.value,
      headers: tableHeaders
    },
    {
      name: 'Em Corte',
      data: itemsCorte.value,
      headers: tableHeaders
    },
    {
      name: 'Na Embegadora',
      data: itemsEmbegadora.value,
      headers: tableHeaders
    },
    {
      name: 'Posição Inválida',
      data: itemsInvalidas.value,
      headers: tableHeadersInvalidas
    }
  ];

  exportToExcel(sheets, 'Bags_Status');
};

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