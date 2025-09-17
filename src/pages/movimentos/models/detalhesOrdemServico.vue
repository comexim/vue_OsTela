<template>
  <v-dialog v-model="dialogVisible" max-width="1400px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-primary text-white d-flex align-center">
        <h4>Detalhes da Ordem de Serviço</h4>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Seção de informações principais -->
        <v-card class="mb-4" elevation="2">
          <v-card-text class="pa-5">
            <!-- Primeira linha: OS/Ticket, Status, Total Peso -->
            <v-row class="mb-1">
              <v-col cols="12" md="4" class="py-1">
                <v-text-field
                  label="OS/Ticket"
                  :model-value="dadosModal.opTck || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4" class="py-1">
                <v-text-field
                  label="Status"
                  :model-value="dadosModal.osstatus || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4" class="py-1">
                <v-text-field
                  label="Total Peso"
                  :model-value="`${totalPeso.toFixed(2)} kg`"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="peso-field"
                />
              </v-col>
            </v-row>
            
            <!-- Segunda linha: Data, Hora, Total Sacas -->
            <v-row>
              <v-col cols="12" md="4" class="py-1">
                <v-text-field
                  label="Data"
                  :model-value="formatarData(dadosModal.itOSData)"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4" class="py-1">
                <v-text-field
                  label="Hora"
                  :model-value="formatarHora(dadosModal.itOSHora)"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4" class="py-1">
                <v-text-field
                  label="Total Sacas"
                  :model-value="totalSacas.toFixed(2)"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="sacas-field"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Tabela de detalhes -->
        <v-card elevation="2">
          <v-data-table
            :headers="headersDetalhes"
            :items="itensOrdenados"
            :loading="loading"
            class="data-table-detalhes"
            :items-per-page="300"
            fixed-header
            height="350px"
            hide-default-footer
          >
            <template v-slot:loading>
              <div class="loading-container">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
                <p class="mt-4 text-grey">Carregando detalhes...</p>
              </div>
            </template>

            <template v-slot:no-data>
              <div class="no-data-container">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
                <h3 class="text-grey-darken-1 mb-2">Nenhum item encontrado</h3>
              </div>
            </template>

            <!-- Formatação customizada das células -->
            <template v-slot:item="{ item }">
              <tr>
                <td>{{ item.itOSItem }}</td>
                <td>
                  <span class="text-green-darken-2">
                    {{ formatarData(item.itOSData) }}
                  </span>
                </td>
                <td>
                  <span class="text-blue-darken-2">
                    {{ formatarHora(item.itOSHora) }}
                  </span>
                </td>
                <td>{{ item.lote }}</td>
                <td>
                  <span class="font-weight-bold text-blue-darken-2">
                    {{ formatarPeso(item.itOsPeso) }}
                  </span>
                </td>
                <td>{{ (item.itOsPeso/59).toFixed(2) }}</td>
                <td>{{ item.itOsTagBag.slice(-6) }}</td>
                <td>{{ item.itOsOrigem }}</td>
                <td>{{ item.itOsDestino }}</td>
                <td>{{ item.osstatus }}</td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>

      <!-- Modais adicionais -->
      <!-- Modal Incluir Serviço -->
      <IncluirServico
        v-model="modalIncluir"
        :dados-ordem-servico="dadosModal"
        :dados-completos="dadosCompletos"
        @confirmar="onIncluirServico"
      />

      <v-dialog v-model="modalAlterar" max-width="500px">
        <v-card>
          <v-card-title>Modal Alterar</v-card-title>
          <v-card-text>Conteúdo do modal Alterar</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="modalAlterar = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="modalExcluir" max-width="500px">
        <v-card>
          <v-card-title>Modal Excluir</v-card-title>
          <v-card-text>Conteúdo do modal Excluir</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="modalExcluir = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="modalGravarOrdem" max-width="500px">
        <v-card>
          <v-card-title>Modal Gravar Ordem</v-card-title>
          <v-card-text>Conteúdo do modal Gravar Ordem</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="modalGravarOrdem = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="modalAlterarDestino" max-width="500px">
        <v-card>
          <v-card-title>Modal Alterar Destino</v-card-title>
          <v-card-text>Conteúdo do modal Alterar Destino</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="modalAlterarDestino = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="modalAtenderItem" max-width="500px">
        <v-card>
          <v-card-title>Modal Atender Item</v-card-title>
          <v-card-text>Conteúdo do modal Atender Item</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="modalAtenderItem = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="modalImprimir" max-width="500px">
        <v-card>
          <v-card-title>Modal Imprimir</v-card-title>
          <v-card-text>Conteúdo do modal Imprimir</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="modalImprimir = false">Fechar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-card-actions class="pa-3">
        <v-btn
          color="success"
          variant="elevated"
          @click="abrirIncluir"
          prepend-icon="mdi-plus"
          size="default"
          class="mr-2"
        >
          Incluir
        </v-btn>
        <v-btn
          color="warning"
          variant="elevated"
          @click="abrirAlterar"
          prepend-icon="mdi-pencil"
          size="default"
          class="mr-2"
        >
          Alterar
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="abrirExcluir"
          prepend-icon="mdi-delete"
          size="default"
          class="mr-2"
        >
          Excluir
        </v-btn>
        <v-btn
          color="info"
          variant="elevated"
          @click="abrirGravarOrdem"
          prepend-icon="mdi-content-save"
          size="default"
          class="mr-2"
        >
          Gravar Ordem
        </v-btn>
        <v-btn
          color="purple"
          variant="elevated"
          @click="abrirAlterarDestino"
          prepend-icon="mdi-map-marker"
          size="default"
          class="mr-2"
        >
          Alterar Destino
        </v-btn>
        <v-btn
          color="teal"
          variant="elevated"
          @click="abrirAtenderItem"
          prepend-icon="mdi-check-circle"
          size="default"
          class="mr-2"
        >
          Atender Item
        </v-btn>
        <v-btn
          color="indigo"
          variant="elevated"
          @click="abrirImprimir"
          prepend-icon="mdi-printer"
          size="default"
          class="mr-2"
        >
          Imprimir
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="elevated"
          @click="fecharModal"
          prepend-icon="mdi-close"
          size="default"
        >
          Fechar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import IncluirServico from './incluirServico.vue';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dadosCompletos: {
    type: Array,
    default: () => []
  },
  itemSelecionado: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Data local
const dialogVisible = ref(props.modelValue);
const dadosModal = ref({});

// Estados dos modais
const modalIncluir = ref(false);
const modalAlterar = ref(false);
const modalExcluir = ref(false);
const modalGravarOrdem = ref(false);
const modalAlterarDestino = ref(false);
const modalAtenderItem = ref(false);
const modalImprimir = ref(false);

// Headers para a tabela de detalhes
const headersDetalhes = [
  {
    title: 'Item',
    key: 'itOSItem',
    align: 'start',
    sortable: true
  },
  {
    title: 'Data',
    key: 'itOSData',
    align: 'start',
    sortable: true
  },
  {
    title: 'Hora',
    key: 'itOSHora',
    align: 'start',
    sortable: true
  },
  {
    title: 'Lote',
    key: 'lote',
    align: 'start',
    sortable: true 
  },
  {
    title: 'Peso',
    key: 'itOsPeso',
    align: 'start',
    sortable: true
  },
  {
    title: 'Sacas',
    key: 'itOsPeso',
    align: 'start',
    sortable: true
  },
  {
    title: 'Tag',
    key: 'itOsTagBag',
    align: 'start',
    sortable: true
  },
  {
    title: 'Origem',
    key: 'itOsOrigem',
    align: 'start',
    sortable: true
  },
  {
    title: 'Destino',
    key: 'itOsDestino',
    align: 'start',
    sortable: true
  },
  {
    title: 'Status',
    key: 'osstatus',
    align: 'start',
    sortable: true
  }
];

// Watch para sincronizar o v-model
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal && props.itemSelecionado) {
    dadosModal.value = { ...props.itemSelecionado };
  }
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

// Computed para filtrar e ordenar itens pelo mesmo osid
const itensOrdenados = computed(() => {
  if (!props.itemSelecionado.osid || !props.dadosCompletos.length) {
    return [];
  }

  // Filtra todos os itens com o mesmo osid
  const itensFiltrados = props.dadosCompletos.filter(item => 
    item.osid === props.itemSelecionado.osid
  );

  // Ordena por itOSItem
  return itensFiltrados.sort((a, b) => {
    const itemA = parseInt(a.itOSItem) || 0;
    const itemB = parseInt(b.itOSItem) || 0;
    return itemA - itemB;
  });
});

// Computed para calcular total do peso
const totalPeso = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    const peso = parseFloat(item.itOsPeso) || 0;
    return total + peso;
  }, 0);
});

// Computed para calcular total de sacas (peso / 59)
const totalSacas = computed(() => {
  return totalPeso.value / 59;
});

// Funções de formatação
const formatarData = (value) => {
  if (!value) return '-';
  if (typeof value === 'string' && value.length === 8 && /^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return value;
};

const formatarHora = (value) => {
  if (!value) return '-';
  if (typeof value === 'string' && value.length === 6 && /^\d{6}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    const second = value.substring(4, 6);
    return `${hour}:${minute}:${second}`;
  }
  if (typeof value === 'string' && value.length === 4 && /^\d{4}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    return `${hour}:${minute}`;
  }
  return value;
};

const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para fechar o modal
const fecharModal = () => {
  dialogVisible.value = false;
};

// Funções para abrir os modais
const abrirIncluir = () => {
  modalIncluir.value = true;
};

const abrirAlterar = () => {
  modalAlterar.value = true;
};

const abrirExcluir = () => {
  modalExcluir.value = true;
};

const abrirGravarOrdem = () => {
  modalGravarOrdem.value = true;
};

const abrirAlterarDestino = () => {
  modalAlterarDestino.value = true;
};

const abrirAtenderItem = () => {
  modalAtenderItem.value = true;
};

const abrirImprimir = () => {
  modalImprimir.value = true;
};

// Função para lidar com a inclusão de serviço
const onIncluirServico = (dadosServico) => {
  console.log('Incluindo serviço:', dadosServico);
  // Aqui você pode adicionar a lógica para salvar o serviço
  // Por exemplo, fazer uma chamada para a API
  
  // Fechar o modal
  modalIncluir.value = false;
  
  // Opcional: atualizar a lista de itens
  // emit('atualizar-dados');
};
</script>

<style scoped>
/* Customização da tabela de detalhes */
.data-table-detalhes {
  max-height: 350px;
  overflow-y: auto;
}

.data-table-detalhes :deep(.v-data-table__wrapper) {
  max-height: 300px;
}

.data-table-detalhes :deep(.v-data-table-header th) {
  background-color: #37474f !important;
  color: white !important;
  font-weight: 600;
  border-bottom: 2px solid #263238;
  font-size: 0.85rem !important;
  padding: 8px 12px !important;
}

.data-table-detalhes :deep(.v-data-table-header th .v-data-table-header__content) {
  color: white;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table-detalhes :deep(.v-data-table__td) {
  font-size: 0.85rem !important;
  padding: 6px 12px !important;
}

/* Estilo para campos de totais */
.peso-field :deep(.v-field__input) {
  font-weight: bold;
  color: #1976d2;
}

.sacas-field :deep(.v-field__input) {
  font-weight: bold;
  color: #388e3c;
}

/* Estados de loading e sem dados */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.no-data-container {
  text-align: center;
  padding: 60px 20px;
}

/* Card de contadores */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
}

/* Responsividade */
@media (max-width: 768px) {
  .data-table-detalhes {
    font-size: 0.85rem;
  }
}
</style>