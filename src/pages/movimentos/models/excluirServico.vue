<!--
  Modal de Exclusão de Serviços
  
  Este componente permite ao usuário excluir um item específico de uma ordem de serviço.
  Funciona de forma similar ao alterarServico, mas remove o item selecionado da lista
  e reenvia todos os outros itens para a API.
-->
<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-error text-white d-flex align-center">
        <v-icon class="mr-2">mdi-delete</v-icon>
        <h4>Excluir Item da Ordem de Serviço</h4>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Informações da Ordem -->
        <v-card class="mb-4" elevation="2">
          <v-card-text class="pa-4">
            <h6 class="text-h6 mb-3 text-error">
              <v-icon class="mr-2">mdi-information</v-icon>
              Informações da Ordem
            </h6>
            
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  label="OS/Ticket"
                  :model-value="dadosOrdemServico.opTck || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Status"
                  :model-value="dadosOrdemServico.itOSStatus || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Data"
                  :model-value="formatarDataParaFormulario(dadosOrdemServico.itOSData) || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Itens que serão excluídos -->
        <v-card class="mb-4" elevation="2" v-if="itemParaExcluir && itemParaExcluir.length > 0">
          <v-card-text class="pa-4">
            <h6 class="text-h6 mb-3 text-error">
              <v-icon class="mr-2">mdi-delete-alert</v-icon>
              {{ totalItensExcluir }} item(ns) que será(ão) excluído(s)
            </h6>
            
            <v-alert type="warning" class="mb-4">
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-alert-circle</v-icon>
                <span>{{ totalItensExcluir === 1 ? 'Este item será removido' : 'Estes itens serão removidos' }} permanentemente da ordem de serviço.</span>
              </div>
            </v-alert>

            <!-- Tabela com os itens a excluir -->
            <v-table density="compact" class="mb-2">
              <thead>
                <tr>
                  <th class="text-left">Item</th>
                  <th class="text-left">Tag Bag</th>
                  <th class="text-left">Lote</th>
                  <th class="text-left">Peso (kg)</th>
                  <th class="text-left">Origem → Destino</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in itemParaExcluir" :key="item.itOSItem">
                  <td class="text-error font-weight-bold">{{ item.itOSItem }}</td>
                  <td>{{ item.itOsTagBag || '-' }}</td>
                  <td>{{ item.lote || '-' }}</td>
                  <td>{{ formatarPeso(item.itOsPeso) }}</td>
                  <td>{{ item.itOsOrigem || '-' }} → {{ item.itOsDestino || '-' }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Mensagem durante processamento -->
        <v-alert v-if="processando" type="info" class="mt-4">
          <div class="d-flex align-center">
            <v-progress-circular
              indeterminate
              color="info"
              size="20"
              class="mr-3"
            ></v-progress-circular>
            <span>Processando exclusão do item...</span>
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="outlined"
          @click="fecharModal"
          :disabled="processando"
          prepend-icon="mdi-close"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="confirmarExclusao"
          :disabled="!itemParaExcluir || itemParaExcluir.length === 0 || processando"
          :loading="processando"
          prepend-icon="mdi-delete"
          class="ml-2"
        >
          {{ processando ? 'Excluindo...' : 'Confirmar Exclusão' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// ===== PROPRIEDADES E EMISSÃO DE EVENTOS =====

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dadosOrdemServico: {
    type: Object,
    default: () => ({})
  },
  itensSelecionados: {
    type: Array,
    default: () => []
  },
  dadosCompletos: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'confirmar']);

// ===== VARIÁVEIS REATIVAS =====

const dialogVisible = ref(props.modelValue);
const processando = ref(false);

// ===== PROPRIEDADES COMPUTADAS =====

const itemParaExcluir = computed(() => {
  return props.itensSelecionados;
});

const totalItensExcluir = computed(() => {
  return props.itensSelecionados.length;
});

// ===== WATCHERS =====

watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

// ===== FUNÇÕES DE FORMATAÇÃO =====

/**
 * Formata data do formato YYYYMMDD para DD/MM/YYYY para o formulário
 */
const formatarDataParaFormulario = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.length === 8 && /^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return value;
};

const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ===== FUNÇÕES DE EXCLUSÃO =====

/**
 * Confirma a exclusão dos itens selecionados
 */
const confirmarExclusao = () => {
  if (!itemParaExcluir.value || itemParaExcluir.value.length === 0) {
    alert('Nenhum item selecionado para exclusão');
    return;
  }

  const totalItens = itemParaExcluir.value.length;
  const listaItens = itemParaExcluir.value.map(item => item.itOSItem).join(', ');
  const mensagem = totalItens === 1 
    ? `Tem certeza que deseja excluir o item ${listaItens}?`
    : `Tem certeza que deseja excluir ${totalItens} itens (${listaItens})?`;

  if (!confirm(mensagem)) {
    return;
  }

  processando.value = true;

  try {
    const todosItensOS = props.dadosCompletos.filter(item => 
      item.osid === props.dadosOrdemServico.osid
    );

    const itensNumerosExcluir = itemParaExcluir.value.map(item => item.itOSItem);
    
    const itensRestantes = todosItensOS.filter(item => 
      !itensNumerosExcluir.includes(item.itOSItem)
    );

    const osid = props.dadosOrdemServico?.osid || "";
    const motCod = props.dadosOrdemServico?.motCod || "";

    const todosItens = itensRestantes.map(item => ({
      osid: item.osid,
      itOSItem: item.itOSItem,
      opTck: item.opTck || props.dadosOrdemServico?.opTck || osid,
      empiCod: item.empiCod || '',
      motCod: motCod,
      itOSData: item.itOSData || '',
      itOSHora: item.itOSHora || '',
      itOsTagBag: item.itOsTagBag || '',
      itOsOrigem: item.itOsOrigem || '',
      itOsTagOrigem: '',
      itOsDestino: item.itOsDestino || '',
      itOsTagDestino: item.itOsDestino?.startsWith('M') ? item.itOsDestino : '',
      itOSStatus: item.itOSStatus || 'AB',
      lote: item.lote || '',
      itOsObs: item.itOsObs || '',
      itOsPeso: parseFloat(item.itOsPeso) || 0,
      itOsPesoSoltar: parseFloat(item.itOsPesoSoltar) || 0
    }));

    console.log('✅ Salvando exclusão - Dados preparados:');
    console.log('🗑️ Itens excluídos:', listaItens);
    console.log('📊 Total de itens restantes:', todosItens.length);

    emit('confirmar', {
      itensExcluidos: itemParaExcluir.value,
      todosItens: todosItens
    });

    dialogVisible.value = false;
    
  } catch (error) {
    console.error('❌ Erro ao processar exclusão:', error);
    alert(`Erro ao processar exclusão:\n${error.message}`);
  } finally {
    processando.value = false;
  }
};

/**
 * Fecha o modal
 */
const fecharModal = () => {
  dialogVisible.value = false;
};
</script>

<style scoped>
/* ===== ESTILOS CUSTOMIZADOS ===== */

/* Campo readonly com destaque de erro */
.text-error {
  color: #d32f2f !important;
  font-weight: bold;
}

/* Campos Readonly */
.v-text-field--readonly :deep(.v-field__input) {
  color: #666 !important;
}

/* Tabela de itens a excluir */
.v-table {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.v-table thead tr th {
  background-color: #f5f5f5 !important;
  font-weight: 600 !important;
  color: #424242 !important;
}

.v-table tbody tr:nth-child(odd) {
  background-color: #fafafa;
}

.v-table tbody tr:hover {
  background-color: #ffebee !important;
}

/* Responsividade */
@media (max-width: 768px) {
  .v-dialog {
    margin: 16px;
  }
}

/* Cards de destaque */
.v-card {
  transition: all 0.3s ease;
}

/* Alertas customizados */
.v-alert {
  border-radius: 8px;
}

/* Botões de ação */
.v-btn {
  text-transform: none;
  font-weight: 500;
}

/* Ícones com espaçamento */
.v-icon {
  margin-right: 8px;
}
</style>
