<template>
  <v-dialog v-model="dialogVisible" max-width="600px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-error text-white d-flex align-center">
        <v-icon class="mr-2">mdi-delete-alert</v-icon>
        <h4>Excluir Ordem de Serviço</h4>
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
              <v-col cols="12" md="6">
                <v-text-field
                  label="OS/Ticket"
                  :model-value="dadosOrdemServico.opTck || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  label="Status"
                  :model-value="dadosOrdemServico.itOSStatus || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Lista de itens selecionados -->
        <v-card elevation="2">
          <v-card-text class="pa-4">
            <h6 class="text-h6 mb-3 text-error">
              <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
              Itens a serem excluídos
            </h6>

            <div v-if="itensParaExcluir.length === 0" class="text-center py-4">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-inbox</v-icon>
              <p class="text-grey">Nenhum item selecionado para exclusão</p>
            </div>

            <v-list v-else class="border rounded">
              <v-list-item
                v-for="(item, index) in itensParaExcluir"
                :key="index"
                class="border-b"
              >
                <template v-slot:prepend>
                  <v-icon color="error" class="mr-3">mdi-delete</v-icon>
                </template>

                <v-list-item-title>
                  <strong>Item {{ item.itOSItem }}</strong>
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  <div class="d-flex flex-wrap gap-2 mt-1">
                    <v-chip size="small" color="primary" variant="outlined">
                      <v-icon start>mdi-calendar</v-icon>
                      {{ formatarData(item.itOSData) }}
                    </v-chip>
                    <v-chip size="small" color="info" variant="outlined">
                      <v-icon start>mdi-weight</v-icon>
                      {{ formatarPeso(item.itOsPeso) }} kg
                    </v-chip>
                    <v-chip size="small" color="success" variant="outlined">
                      <v-icon start>mdi-tag</v-icon>
                      {{ item.itOsTagBag?.slice(-6) || '-' }}
                    </v-chip>
                  </div>
                  <div class="mt-1">
                    <small class="text-grey-darken-1">
                      De: <strong>{{ item.itOsOrigem }}</strong> → 
                      Para: <strong>{{ item.itOsDestino }}</strong>
                    </small>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Mensagem durante exclusão -->
        <v-alert v-if="excluindo" type="info" class="mt-4">
          <div class="d-flex align-center">
            <v-progress-circular
              indeterminate
              color="info"
              size="20"
              class="mr-3"
            ></v-progress-circular>
            <span>Excluindo itens selecionados...</span>
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          variant="outlined"
          @click="fecharModal"
          :disabled="excluindo"
          prepend-icon="mdi-close"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="confirmarExclusao"
          :disabled="itensParaExcluir.length === 0 || excluindo"
          :loading="excluindo"
          prepend-icon="mdi-delete"
          class="ml-2"
        >
          {{ excluindo ? 'Excluindo...' : 'Confirmar Exclusão' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { WMSOS } from '../../../stores/Consultas/setWMSOS';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dadosOrdemServico: {
    type: Object,
    default: () => ({})
  },
  itemSelecionado: {
    type: Object,
    default: null
  },
  dadosCompletos: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'exclusao-concluida', 'erro-exclusao']);

// Data local
const dialogVisible = ref(props.modelValue);
const excluindo = ref(false);

// Store
const wmsos = WMSOS();

// Watch para sincronizar o v-model
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
  if (!newVal) {
    // Reset states when closing
    excluindo.value = false;
  }
});

// Computed para obter itens a serem excluídos
const itensParaExcluir = computed(() => {
  if (!props.itemSelecionado) return [];
  // Se vier um array, retorna o array
  if (Array.isArray(props.itemSelecionado)) {
    return props.itemSelecionado;
  }
  // Se vier um único objeto, retorna como array
  if (props.itemSelecionado && props.itemSelecionado.itOSItem) {
    return [props.itemSelecionado];
  }
  return [];
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

const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para fechar o modal
const fecharModal = () => {
  if (!excluindo.value) {
    dialogVisible.value = false;
  }
};

// Função para confirmar exclusão
const confirmarExclusao = async () => {
  if (itensParaExcluir.value.length === 0) {
    return;
  }

  excluindo.value = true;

  try {
    // Para cada item selecionado, enviar para a API
    for (const item of itensParaExcluir.value) {
      const payload = {
        osid: item.osid || props.dadosOrdemServico.osid,
        ositem: item.itOSItem
      };

      console.log('Enviando para DELOE:', payload);
      await wmsos.DELOE(payload);
    }

    // Emitir evento de sucesso
    emit('exclusao-concluida', {
      sucessos: itensParaExcluir.value.length,
      erros: 0
    });

    // Fechar modal
    fecharModal();

  } catch (error) {
    console.error('Erro ao excluir:', error);
    
    // Emitir evento de erro
    emit('erro-exclusao', {
      sucessos: 0,
      erros: 1,
      erro: error.message || 'Erro ao excluir itens'
    });
  } finally {
    excluindo.value = false;
  }
};
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid #e0e0e0;
}

.v-list-item:last-child {
  border-bottom: none;
}

.border {
  border: 1px solid #e0e0e0;
}

.border-b {
  border-bottom: 1px solid #e0e0e0;
}

.gap-2 {
  gap: 8px;
}

/* Estilo para chips */
.v-chip {
  margin: 2px;
}
</style>
