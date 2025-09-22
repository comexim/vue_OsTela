<template>
  <v-dialog v-model="dialogVisible" max-width="800px" persistent>
    <v-card>
      <v-card-title class="pa-3 bg-purple text-white d-flex align-center">
        <v-icon class="mr-2">mdi-map-marker</v-icon>
        <h4>Alterar Destino</h4>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Informações da OS -->
        <v-card class="mb-4" elevation="2">
          <v-card-subtitle class="pa-3 bg-grey-lighten-4">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Informações da Ordem de Serviço
          </v-card-subtitle>
          <v-card-text class="pa-4">
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
                  label="OSID"
                  :model-value="dadosOrdemServico.osid || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Seleção de Destino -->
        <v-card elevation="2">
          <v-card-subtitle class="pa-3 bg-grey-lighten-4">
            <v-icon class="mr-2">mdi-warehouse</v-icon>
            Selecionar Nova Moega de Destino
          </v-card-subtitle>
          <v-card-text class="pa-4">
            <!-- Loading de moegas -->
            <div v-if="loadingMoegas" class="text-center py-6">
              <v-progress-circular indeterminate color="purple" size="64"></v-progress-circular>
              <p class="mt-4 text-grey">Carregando moegas disponíveis...</p>
            </div>

            <!-- Seleção de moegas -->
            <div v-else-if="moegasList && moegasList.length > 0">
              <v-select
                v-model="moegaSelecionada"
                :items="moegasList"
                item-title="enderCod"
                item-value="enderCod"
                label="Selecione a nova moega de destino"
                variant="outlined"
                density="compact"
                clearable
                prepend-inner-icon="mdi-warehouse"
                no-data-text="Nenhuma moega disponível"
                class="mb-3"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon color="purple">mdi-warehouse</v-icon>
                    </template>
                    <v-list-item-subtitle>{{ item.raw.descricao }}</v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-select>

              <!-- Informação da seleção -->
              <v-alert 
                v-if="moegaSelecionada"
                type="success"
                variant="tonal"
                class="mt-3"
              >
                <v-icon class="mr-2">mdi-check-circle</v-icon>
                Moega selecionada: <strong>{{ moegaSelecionada }}</strong>
              </v-alert>
            </div>

            <!-- Nenhuma moega encontrada -->
            <div v-else class="text-center py-6">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-warehouse-off</v-icon>
              <h3 class="text-grey-darken-1 mb-2">Nenhuma moega disponível</h3>
              <p class="text-grey">Não foi possível carregar as moegas no momento.</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Lista de itens selecionados -->
        <v-card class="mt-4" elevation="2">
          <v-card-subtitle class="pa-3 bg-grey-lighten-4">
            <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
            Itens que terão o destino alterado ({{ itensSelecionados.length }})
          </v-card-subtitle>
          <v-card-text class="pa-4">
            <div v-if="itensSelecionados.length === 0" class="text-center py-4">
              <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-inbox</v-icon>
              <p class="text-grey">Nenhum item selecionado</p>
            </div>
            <v-list v-else class="border rounded">
              <v-list-item
                v-for="(item, index) in itensSelecionados"
                :key="index"
                class="border-b"
              >
                <template v-slot:prepend>
                  <v-icon color="purple" class="mr-3">mdi-cube-outline</v-icon>
                </template>
                <v-list-item-title>
                  <strong>Item {{ item.itOSItem }}</strong>
                </v-list-item-title>
                <v-list-item-subtitle>
                  <div class="d-flex flex-wrap gap-2 mt-1">
                    <v-chip size="small" color="info" variant="outlined">
                      <v-icon start>mdi-weight</v-icon>
                      {{ formatarPeso(item.itOsPeso) }} kg
                    </v-chip>
                    <v-chip size="small" color="success" variant="outlined">
                      <v-icon start>mdi-tag</v-icon>
                      {{ item.itOsTagBag?.slice(-6) || '-' }}
                    </v-chip>
                    <v-chip size="small" color="warning" variant="outlined">
                      <v-icon start>mdi-warehouse</v-icon>
                      De: {{ item.itOsOrigem }} → Para: {{ item.itOsDestino }}
                    </v-chip>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-btn
          color="grey"
          variant="elevated"
          @click="fecharModal"
          prepend-icon="mdi-cancel"
          size="default"
        >
          Cancelar
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="purple"
          variant="elevated"
          @click="confirmarAlteracao"
          prepend-icon="mdi-check"
          size="default"
          :disabled="!moegaSelecionada || loadingAlteracao"
          :loading="loadingAlteracao"
        >
          Confirmar Alteração
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Snackbar para mensagens -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="4000"
      location="top"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">
          Fechar
        </v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { moegas } from '@/stores/Consultas/getMoega';
import { WMSOS } from '@/stores/Consultas/setWMSOS';

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
    // Pode ser array de itens ou objeto único
    type: [Object, Array],
    default: () => ([])
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'alteracao-concluida', 'erro-alteracao']);

// Stores
const moegasStore = moegas();
const wmsosStore = WMSOS();

// Data local
const dialogVisible = ref(props.modelValue);
const moegasList = ref([]);
const moegaSelecionada = ref(null);
const loadingMoegas = ref(false);
const loadingAlteracao = ref(false);

// Snackbar
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

// Watch para sincronizar o v-model
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal) {
    carregarMoegas();
    moegaSelecionada.value = null; // Limpa seleção anterior
    console.log('Modal alterarDestino aberto com itens:', props.itemSelecionado);
  }
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

// Computed para processar itens selecionados
const itensSelecionados = computed(() => {
  if (!props.itemSelecionado) return [];
  
  if (Array.isArray(props.itemSelecionado)) {
    console.log('Itens selecionados (array):', props.itemSelecionado);
    return props.itemSelecionado;
  }
  
  if (props.itemSelecionado && props.itemSelecionado.itOSItem) {
    console.log('Item selecionado (objeto):', props.itemSelecionado);
    return [props.itemSelecionado];
  }
  
  return [];
});

// Função para formatação de peso
const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para carregar moegas
const carregarMoegas = async () => {
  try {
    loadingMoegas.value = true;
    const response = await moegasStore.moegas();
    
    if (response && Array.isArray(response)) {
      moegasList.value = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      moegasList.value = response.data;
    } else {
      moegasList.value = [];
      mostrarMensagem('Nenhuma moega encontrada', 'warning');
    }
  } catch (error) {
    console.error('Erro ao carregar moegas:', error);
    mostrarMensagem('Erro ao carregar moegas disponíveis', 'error');
    moegasList.value = [];
  } finally {
    loadingMoegas.value = false;
  }
};

// Função para confirmar alteração
const confirmarAlteracao = async () => {
  if (!moegaSelecionada.value) {
    mostrarMensagem('Por favor, selecione uma moega de destino', 'warning');
    return;
  }

  const itens = itensSelecionados.value;
  console.log('Confirmando alteração para itens:', itens);

  if (itens.length === 0) {
    mostrarMensagem('Selecione ao menos um item para alterar o destino', 'warning');
    return;
  }

  loadingAlteracao.value = true;
  let sucesso = 0;
  let erro = 0;
  let responses = [];

  console.log(`Alterando destino de ${itens.length} itens para: ${moegaSelecionada.value}`);

  for (const item of itens) {
    try {
      const payload = {
        osid: item.osid || props.dadosOrdemServico.osid,
        ositem: item.itOSItem,
        endereco: moegaSelecionada.value
      };
      
      console.log('Enviando payload para item:', payload);
      
      const response = await wmsosStore.UPDENDDESTOE(payload);
      responses.push({ item: item.itOSItem, response });
      if (response && response.success !== false) {
        sucesso++;
        console.log(`Item ${item.itOSItem} alterado com sucesso`);
      } else {
        erro++;
        console.log(`Erro ao alterar item ${item.itOSItem}:`, response);
      }
    } catch (e) {
      erro++;
      console.error(`Exceção ao alterar item ${item.itOSItem}:`, e);
      responses.push({ item: item.itOSItem, error: e });
    }
  }

  if (erro === 0) {
    mostrarMensagem('Destino alterado com sucesso!', 'success');
    emit('alteracao-concluida', { sucesso, erro, responses });
    setTimeout(() => {
      fecharModal();
    }, 1500);
  } else {
    mostrarMensagem(`${sucesso} sucesso(s), ${erro} erro(s) ao alterar destino`, 'error');
    emit('erro-alteracao', { sucesso, erro, responses });
  }
  loadingAlteracao.value = false;
};

// Função para fechar o modal
const fecharModal = () => {
  dialogVisible.value = false;
  moegaSelecionada.value = null;
};

// Função para mostrar mensagens
const mostrarMensagem = (message, color = 'success') => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  showSnackbar.value = true;
};
</script>

<style scoped>
/* Responsividade */
@media (max-width: 768px) {
  .v-select {
    font-size: 14px;
  }
}

/* Customização do dialog */
.v-dialog > .v-card {
  overflow-y: auto;
  max-height: 90vh;
}

/* Animação suave para as transições */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-alert {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
