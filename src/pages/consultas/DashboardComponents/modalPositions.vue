<template>
  <v-dialog v-model="isOpen" max-width="1200px" persistent>
    <v-card>
      <v-card-text class="pa-0">
        <v-tabs v-model="currentTab" bg-color="blue-grey-lighten-5" color="primary" align-tabs="center">
          <v-tab value="livres">
            <v-icon start>mdi-map-marker-check</v-icon>
            Posições Livres
          </v-tab>
          <v-tab value="4pos">
            <v-icon start>mdi-numeric-4-box</v-icon>
            4 Posições
          </v-tab>
          <v-tab value="3pos">
            <v-icon start>mdi-numeric-3-box</v-icon>
            3 Posições
          </v-tab>
          <v-tab value="2pos">
            <v-icon start>mdi-numeric-2-box</v-icon>
            2 Posições
          </v-tab>
          <v-tab value="1pos">
            <v-icon start>mdi-numeric-1-box</v-icon>
            1 Posição
          </v-tab>
          <v-tab value="ocupados">
            <v-icon start>mdi-package-variant</v-icon>
            Ocupados
          </v-tab>
          <v-tab value="empenhados">
            <v-icon start>mdi-lock</v-icon>
            Empenhados
          </v-tab>
          <v-tab value="bloqueados">
            <v-icon start>mdi-block-helper</v-icon>
            Bloqueados
          </v-tab>
          <v-tab value="invalidas">
            <v-icon start>mdi-alert-circle</v-icon>
            Posições Inválidas
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

          <v-window-item value="4pos">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="items4Pos"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="3pos">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="items3Pos"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="2pos">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="items2Pos"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="1pos">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeaders"
                :items="items1Pos"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="ocupados">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersOcupados"
                :items="itemsOcupados"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="empenhados">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersEmpenhados"
                :items="itemsEmpenhados"
                :items-per-page="-1"
                class="elevation-1"
                density="compact"
                hide-default-footer
              >
              </v-data-table>
            </v-container>
          </v-window-item>

          <v-window-item value="bloqueados">
            <v-container class="pa-4">
              <v-data-table
                :headers="tableHeadersBloqueados"
                :items="itemsBloqueados"
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
                :headers="tableHeaders"
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
    default: 'livres',
    validator: (value) => ['livres', '4pos', '3pos', '2pos', '1pos', 'ocupados', 'empenhados', 'bloqueados', 'invalidas'].includes(value)
  },
  enderColors: {
    type: Array,
    default: () => []
  },
  bagEnder: {
    type: Array,
    default: () => []
  },
  enderecosEMP: {
    type: Array,
    default: () => []
  },
  enderecosBlq: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const isOpen = ref(props.modelValue);
const currentTab = ref(props.initialTab);

// Definição das colunas da tabela
const tableHeaders = [
  { title: 'Endereço', key: 'endereco', align: 'start', sortable: true },
  { title: 'Nível A', key: 'nivelA', align: 'center', sortable: true },
  { title: 'Nível B', key: 'nivelB', align: 'center', sortable: true },
  { title: 'Nível C', key: 'nivelC', align: 'center', sortable: true },
  { title: 'Nível D', key: 'nivelD', align: 'center', sortable: true }
];

// Headers simplificados para a tabela de posições livres
const tableHeadersLivres = [
  { title: 'Endereço', key: 'endereco', align: 'start', sortable: true },
  { title: 'Nível A', key: 'nivelA', align: 'center', sortable: true },
  { title: 'Nível B', key: 'nivelB', align: 'center', sortable: true },
  { title: 'Nível C', key: 'nivelC', align: 'center', sortable: true },
  { title: 'Nível D', key: 'nivelD', align: 'center', sortable: true }
];

// Headers para a tabela de empenhados
const tableHeadersEmpenhados = [
  { title: 'Endereço', key: 'endereco', align: 'start', sortable: true },
  { title: 'Lote', key: 'lote', align: 'center', sortable: true }
];

// Headers para a tabela de bloqueados
const tableHeadersBloqueados = [
  { title: 'Endereço', key: 'endereco', align: 'start', sortable: true }
];

// Headers para a tabela de ocupados
const tableHeadersOcupados = [
  { title: 'Endereço', key: 'subEndereco', align: 'start', sortable: true },
  { title: 'Tag', key: 'tag', align: 'center', sortable: true },
  { title: 'Lote', key: 'lote', align: 'center', sortable: true },
  { title: 'Peso', key: 'peso', align: 'center', sortable: true},
  { title: 'Sacas', key: 'sacas', align: 'center', sortable: true}
];

// Função auxiliar para extrair o prefixo do endereço
const getEnderecoPrefixo = (enderCod) => {
  if (!enderCod || enderCod.length < 2) return enderCod;
  return enderCod.slice(0, -1);
};

// Cria um mapa de endereços com bags da API
const enderecosComBags = computed(() => {
  const mapa = {};
  console.log('bagEnder recebido:', props.bagEnder);
  props.bagEnder.forEach(item => {
    mapa[item.Endereco] = item.Bags || [];
  });
  console.log('Mapa de endereços com bags:', mapa);
  return mapa;
});

// Agrupa endereços por prefixo considerando enderColors
const enderecosAgrupados = computed(() => {
  const grupos = {};
  
  props.enderColors
    .filter(item => !['B','D','L','M'].includes(item.code.charAt(0)))
    .forEach(item => {
      const prefixo = getEnderecoPrefixo(item.code);
      if (!grupos[prefixo]) {
        grupos[prefixo] = {
          enderecos: [],
          bags: enderecosComBags.value[prefixo] || []
        };
      }
      grupos[prefixo].enderecos.push(item);
    });
  
  return grupos;
});

// Função para obter o valor de uma posição (lote + tag do bag ou vazio se livre)
const getBagTag = (bags, subEndereco) => {
  const bag = bags.find(b => b.SubEndereco === subEndereco);
  return bag ? `${bag.BagLote} (${bag.BagTag})` : '';
};

// Endereços com posições livres (1 a 4 posições livres)
const itemsLivres = computed(() => {
  const result = [];
  
  Object.entries(enderecosAgrupados.value).forEach(([prefixo, data]) => {
    const numBags = data.bags.length;
    
    // Inclui endereços com pelo menos 1 posição livre (1, 2, 3 ou 4 posições livres)
    if (numBags < 4) {
      const nivelA = getBagTag(data.bags, `${prefixo}A`) ? 'X' : 'Livre';
      const nivelB = getBagTag(data.bags, `${prefixo}B`) ? 'X' : 'Livre';
      const nivelC = getBagTag(data.bags, `${prefixo}C`) ? 'X' : 'Livre';
      const nivelD = getBagTag(data.bags, `${prefixo}D`) ? 'X' : 'Livre';
      
      result.push({
        endereco: prefixo,
        nivelA: nivelA,
        nivelB: nivelB,
        nivelC: nivelC,
        nivelD: nivelD
      });
    }
  });
  
  // Ordena por endereço
  result.sort((a, b) => a.endereco.localeCompare(b.endereco));
  
  return result;
});

// Endereços com 4 posições livres (não tem bags ou tem 0 bags)
const items4Pos = computed(() => {
  const result = [];
  
  Object.entries(enderecosAgrupados.value).forEach(([prefixo, data]) => {
    const numBags = data.bags.length;
    console.log(`Prefixo: ${prefixo}, NumBags: ${numBags}`);
    
    if (numBags === 0) {
      result.push({
        endereco: prefixo,
        nivelA: '',
        nivelB: '',
        nivelC: '',
        nivelD: ''
      });
    }
  });
  
  console.log('Items 4 posições:', result);
  return result;
});

// Endereços com 3 posições livres (1 bag ocupado)
const items3Pos = computed(() => {
  const result = [];
  
  Object.entries(enderecosAgrupados.value).forEach(([prefixo, data]) => {
    const numBags = data.bags.length;
    
    if (numBags === 1) {
      result.push({
        endereco: prefixo,
        nivelA: getBagTag(data.bags, `${prefixo}A`),
        nivelB: getBagTag(data.bags, `${prefixo}B`),
        nivelC: getBagTag(data.bags, `${prefixo}C`),
        nivelD: getBagTag(data.bags, `${prefixo}D`)
      });
    }
  });
  
  return result;
});

// Endereços com 2 posições livres (2 bags ocupados)
const items2Pos = computed(() => {
  const result = [];
  
  Object.entries(enderecosAgrupados.value).forEach(([prefixo, data]) => {
    const numBags = data.bags.length;
    
    if (numBags === 2) {
      result.push({
        endereco: prefixo,
        nivelA: getBagTag(data.bags, `${prefixo}A`),
        nivelB: getBagTag(data.bags, `${prefixo}B`),
        nivelC: getBagTag(data.bags, `${prefixo}C`),
        nivelD: getBagTag(data.bags, `${prefixo}D`)
      });
    }
  });
  
  return result;
});

// Endereços com 1 posição livre (3 bags ocupados)
const items1Pos = computed(() => {
  const result = [];
  
  Object.entries(enderecosAgrupados.value).forEach(([prefixo, data]) => {
    const numBags = data.bags.length;
    
    if (numBags === 3) {
      result.push({
        endereco: prefixo,
        nivelA: getBagTag(data.bags, `${prefixo}A`),
        nivelB: getBagTag(data.bags, `${prefixo}B`),
        nivelC: getBagTag(data.bags, `${prefixo}C`),
        nivelD: getBagTag(data.bags, `${prefixo}D`)
      });
    }
  });
  
  return result;
});

// Endereços ocupados - todos os subendereços com bags
const itemsOcupados = computed(() => {
  const result = [];
  
  props.bagEnder.forEach(endereco => {
    if (endereco.Bags && Array.isArray(endereco.Bags)) {
      endereco.Bags.forEach(bag => {
        result.push({
          subEndereco: bag.SubEndereco,
          tag: bag.BagTag,
          lote: bag.BagLote,
          peso: bag.BagKgAtu,
          sacas: bag.BagScAtu
        });
      });
    }
  });
  
  // Ordena por subendereco
  result.sort((a, b) => a.subEndereco.localeCompare(b.subEndereco));
  
  return result;
});

// Endereços empenhados
const itemsEmpenhados = computed(() => {
  return props.enderecosEMP.map(item => ({
    endereco: item.EnderCod,
    lote: item.BagLote
  }));
});

// Endereços bloqueados
const itemsBloqueados = computed(() => {
  return props.enderecosBlq.map(item => ({
    endereco: item.EnderCod
  }));
});

// Posições inválidas - será implementado futuramente
const itemsInvalidas = computed(() => {
  return [];
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
      name: 'Posições Livres',
      data: itemsLivres.value,
      headers: tableHeadersLivres
    },
    {
      name: '4 Posições',
      data: items4Pos.value,
      headers: tableHeaders
    },
    {
      name: '3 Posições',
      data: items3Pos.value,
      headers: tableHeaders
    },
    {
      name: '2 Posições',
      data: items2Pos.value,
      headers: tableHeaders
    },
    {
      name: '1 Posição',
      data: items1Pos.value,
      headers: tableHeaders
    },
    {
      name: 'Ocupados',
      data: itemsOcupados.value,
      headers: tableHeadersOcupados
    },
    {
      name: 'Empenhados',
      data: itemsEmpenhados.value,
      headers: tableHeadersEmpenhados
    },
    {
      name: 'Bloqueados',
      data: itemsBloqueados.value,
      headers: tableHeadersBloqueados
    },
    {
      name: 'Posições Inválidas',
      data: itemsInvalidas.value,
      headers: tableHeaders
    }
  ];

  exportToExcel(sheets, 'Posicoes_Armazem');
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