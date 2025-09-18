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

            <!-- Lista de moegas -->
            <div v-else-if="moegasList && moegasList.length > 0">
              <v-row>
                <v-col 
                  v-for="moega in moegasList" 
                  :key="moega.enderCod"
                  cols="12" 
                  sm="6" 
                  md="4"
                >
                  <v-card
                    :color="moegaSelecionada === moega.enderCod ? 'purple' : 'white'"
                    :elevation="moegaSelecionada === moega.enderCod ? 8 : 2"
                    class="moega-card"
                    hover
                    @click="selecionarMoega(moega.enderCod)"
                  >
                    <v-card-title class="text-center py-3">
                      <v-icon 
                        :color="moegaSelecionada === moega.enderCod ? 'white' : 'purple'" 
                        class="mr-2"
                      >
                        mdi-warehouse
                      </v-icon>
                      <span :class="moegaSelecionada === moega.enderCod ? 'text-white' : 'text-purple'">
                        {{ moega.enderCod }}
                      </span>
                    </v-card-title>
                    <v-card-text class="text-center py-2">
                      <span :class="moegaSelecionada === moega.enderCod ? 'text-white' : 'text-grey-darken-1'">
                        {{ moega.descricao || 'Moega' }}
                      </span>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Informação da seleção -->
              <v-alert 
                v-if="moegaSelecionada"
                type="success"
                variant="tonal"
                class="mt-4"
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
    type: Object,
    default: () => ({})
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
  }
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

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

// Função para selecionar moega
const selecionarMoega = (enderCod) => {
  if (moegaSelecionada.value === enderCod) {
    // Se clicar na mesma moega, desseleciona
    moegaSelecionada.value = null;
  } else {
    // Seleciona a nova moega
    moegaSelecionada.value = enderCod;
  }
};

// Função para confirmar alteração
const confirmarAlteracao = async () => {
  if (!moegaSelecionada.value) {
    mostrarMensagem('Por favor, selecione uma moega de destino', 'warning');
    return;
  }

  try {
    loadingAlteracao.value = true;

    // Monta o payload para a API UPDENDDESTOE
    const payload = {
      osid: props.dadosOrdemServico.osid,
      endereco: moegaSelecionada.value
    };

    console.log('Enviando alteração de destino:', payload);

    // Chama a API UPDENDDESTOE
    const response = await wmsosStore.UPDENDDESTOE(payload);

    if (response && response.success !== false) {
      mostrarMensagem('Destino alterado com sucesso!', 'success');
      
      // Emite evento de sucesso
      emit('alteracao-concluida', {
        osid: payload.osid,
        novoDestino: payload.destino,
        response
      });

      // Fecha o modal após 1.5 segundos
      setTimeout(() => {
        fecharModal();
      }, 1500);
    } else {
      const mensagemErro = response?.message || 'Erro ao alterar destino';
      mostrarMensagem(mensagemErro, 'error');
      
      emit('erro-alteracao', {
        erro: mensagemErro,
        payload,
        response
      });
    }
  } catch (error) {
    console.error('Erro ao alterar destino:', error);
    const mensagemErro = error.message || 'Erro interno ao alterar destino';
    mostrarMensagem(mensagemErro, 'error');
    
    emit('erro-alteracao', {
      erro: mensagemErro,
      payload: {
        osid: props.dadosOrdemServico.osid,
        destino: moegaSelecionada.value
      },
      error
    });
  } finally {
    loadingAlteracao.value = false;
  }
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
/* Customização dos cards de moega */
.moega-card {
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 120px;
}

.moega-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
}

/* Responsividade */
@media (max-width: 768px) {
  .moega-card {
    min-height: 100px;
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
