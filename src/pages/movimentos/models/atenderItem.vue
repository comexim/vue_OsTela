<template>
  <!-- ===================================
       MODAL DE ATENDIMENTO DE ITEM
       ===================================
       Modal responsivo para atendimento de itens de OS
       com seleção de posição e execução de movimentação
  -->
  <v-dialog v-model="dialogVisible" max-width="1400px" persistent>
    <v-card>
      <!-- Header do Modal -->
      <v-card-title class="pa-3 bg-teal text-white d-flex align-center">
        <v-icon class="mr-2">mdi-check-circle</v-icon>
        <h4>Atender Item</h4>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- ===================================
             SEÇÃO: INFORMAÇÕES DO ITEM
             ===================================
             Exibe dados readonly do item selecionado
        -->
        <v-card class="mb-4" elevation="2" height="300px">
          <v-card-subtitle class="pa-3 bg-grey-lighten-4">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Informações do Item Selecionado
          </v-card-subtitle>
          <v-card-text class="pa-4">
            <!-- Linha 1: OS e Item -->
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field
                  label="OS"
                  :model-value="itemData.osid || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  label="Item"
                  :model-value="itemData.itOSItem || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
                            <v-col cols="12" md="3">
                <v-text-field
                  label="Lote"
                  :model-value="itemData.lote || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  label="Origem"
                  :model-value="itemData.itOsOrigem || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>

            <!-- Linha 3: Destino e Bag -->
            <v-row>
              <v-col cols="12" md="3">
                <v-text-field
                  label="Destino"
                  :model-value="itemData.itOsDestino || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  label="Bag"
                  :model-value="itemData.itOsTagBag || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
                            <v-col cols="12" md="3">
                <v-text-field
                  label="Empilhadeira"
                  :model-value="itemData.itOsEmpiCod || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  label="Motorista"
                  :model-value="itemData.itOsMotCod || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>


            <!-- Linha 5: Data, Hora e Peso -->
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Data"
                  :model-value="formatarData(itemData.itOSData)"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Hora"
                  :model-value="formatarHora(itemData.itOSHora)"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  label="Peso"
                  :model-value="formatarPeso(itemData.itOsPeso)"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ===================================
             SEÇÃO: CONFIGURAÇÕES DE ATENDIMENTO
             ===================================
             Seleção de posição e tipo de movimentação
        -->
        <v-card elevation="2">
          <v-card-text class="pa-4">
            <!-- Loading de posições -->
            <div v-if="loadingPosicoes" class="text-center py-4">
              <v-progress-circular indeterminate color="teal" size="32"></v-progress-circular>
              <p class="mt-2 text-grey">Carregando posições...</p>
            </div>

            <!-- Seleção de posição -->
            <div v-else>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="posicaoSelecionada"
                    :items="posicoesOptions"
                    label="Posição *"
                    placeholder="Selecione a posição"
                    variant="outlined"
                    density="compact"
                    :error="!posicaoSelecionada && tentouSalvar"
                    :error-messages="!posicaoSelecionada && tentouSalvar ? 'Posição é obrigatória' : ''"
                  />
                </v-col>
              </v-row>

            
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>

      <!-- ===================================
           AÇÕES DO MODAL
           ===================================
           Botões de cancelar e confirmar
      -->
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
          color="teal"
          variant="elevated"
          @click="confirmarAtendimento"
          prepend-icon="mdi-check"
          size="default"
          :disabled="!posicaoSelecionada || loadingAtendimento"
          :loading="loadingAtendimento"
        >
          Confirmar Atendimento
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- ===================================
         SNACKBAR PARA MENSAGENS
         ===================================
         Feedback visual para o usuário
    -->
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
import { ref, computed, watch } from 'vue';
import { WMSOS } from '@/stores/Consultas/setWMSOS';

/**
 * ===================================
 * COMPONENTE: AtenderItem.vue
 * ===================================
 * Modal para atendimento de itens de ordem de serviço
 * 
 * Funcionalidades:
 * - Seleção de posição para movimentação
 * - Movimentação normal (pegar + soltar bag)
 * - Corte de bag
 * - Validação de APIs e tratamento de erros
 * 
 * APIs utilizadas:
 * - pegarBag: Pega bag da origem
 * - soltarBag: Solta bag no destino
 * - cortarBag: Corta bag (para itens com "PARTE" na observação)
 */

// ===================================
// PROPS E EMITS
// ===================================
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  itemSelecionado: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue', 'atendimento-concluido', 'erro-atendimento']);

// ===================================
// STORES E DEPENDÊNCIAS
// ===================================
const wmsosStore = WMSOS();

// ===================================
// ESTADO REATIVO
// ===================================

// Estado do modal
const dialogVisible = ref(props.modelValue);
const itemData = ref({});

// Estado da seleção de posição
const posicaoSelecionada = ref(null);
const posicoesOptions = ref([]);
const loadingPosicoes = ref(false);

// Estado do atendimento
const loadingAtendimento = ref(false);
const tentouSalvar = ref(false);

// Estado do snackbar
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

// ===================================
// WATCHERS
// ===================================

// Sincroniza o v-model com o estado interno do modal
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
  
  // Quando o modal abre, inicializa os dados
  if (newVal && props.itemSelecionado) {
    itemData.value = { ...props.itemSelecionado };
    posicaoSelecionada.value = null;
    tentouSalvar.value = false;
    carregarPosicoes();
  }
});

// Emite mudanças do estado do modal para o componente pai
watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

// ===================================
// COMPUTED PROPERTIES
// ===================================

/**
 * Determina o tipo de movimentação baseado nos dados do item
 * 
 * Tipos possíveis:
 * - 'corte': Item com observação contendo "PARTE" e destino válido
 * - 'normal': Item com destino válido (com ou sem origem)
 * - null: Item sem destino válido
 */
const tipoMovimentacao = computed(() => {
  // Log para debug - IMPORTANTE: mantém visibilidade do processo de decisão
  console.log('🔍 [TIPO MOVIMENTAÇÃO] Analisando item:', {
    itOsObs: itemData.value.itOsObs,
    itOsOrigem: itemData.value.itOsOrigem,
    itOsDestino: itemData.value.itOsDestino
  });
  
  // Verifica se é corte: observação com "PARTE" + destino
  if (itemData.value.itOsObs && itemData.value.itOsObs.includes("PARTE") && itemData.value.itOsDestino) {
    console.log('✂️ [TIPO MOVIMENTAÇÃO] Tipo: CORTE (observação contém PARTE)');
    return 'corte';
  }
  
  // Verifica se é movimentação normal: origem + destino
  if (itemData.value.itOsOrigem && itemData.value.itOsDestino) {
    console.log('🔄 [TIPO MOVIMENTAÇÃO] Tipo: NORMAL (origem + destino)');
    return 'normal';
  }
  
  // Movimentação apenas para destino (sem origem)
  if (itemData.value.itOsDestino && !itemData.value.itOsOrigem) {
    console.log('📍 [TIPO MOVIMENTAÇÃO] Tipo: NORMAL (apenas destino)');
    return 'normal';
  }
  
  console.log('❌ [TIPO MOVIMENTAÇÃO] Tipo: NULL (sem destino válido)');
  return null;
});

/**
 * Gera descrição amigável do tipo de movimentação
 */
const descricaoMovimentacao = computed(() => {
  switch (tipoMovimentacao.value) {
    case 'corte':
      return 'A bag será cortada no destino especificado.';
    case 'normal':
      if (itemData.value.itOsOrigem && itemData.value.itOsDestino) {
        return 'A bag será movida da origem para o destino.';
      } else if (itemData.value.itOsDestino) {
        return 'A bag será posicionada no destino especificado.';
      }
      return 'Movimentação padrão será executada.';
    default:
      return 'Tipo de movimentação não definido.';
  }
});

// ===================================
// FUNÇÕES UTILITÁRIAS
// ===================================

/**
 * Formata data do formato YYYYMMDD para DD/MM/YYYY
 */
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

/**
 * Formata hora do formato HHMMSS ou HHMM para HH:MM:SS ou HH:MM
 */
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

/**
 * Formata peso para formato brasileiro (0,00)
 */
const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Mostra mensagem no snackbar
 */
const mostrarMensagem = (message, color = 'success') => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  showSnackbar.value = true;
};

// ===================================
// FUNÇÕES PRINCIPAIS
// ===================================

/**
 * Carrega as posições disponíveis para seleção
 * Gera posições no formato "01A" até "09D" (9 posições x 4 níveis)
 * Baseado na lógica do OrdemServico.vue legacy
 */
const carregarPosicoes = async () => {
  try {
    loadingPosicoes.value = true;
    
    const posicoes = [];
    
    // Gera posições: 01-09 (posições) x A-D (níveis)
    for (let pos = 1; pos <= 9; pos++) {
      for (let nivel of ['A', 'B', 'C', 'D']) {
        const posicaoFormatada = pos.toString().padStart(2, '0') + nivel;
        posicoes.push({
          title: posicaoFormatada,
          value: posicaoFormatada
        });
      }
    }
    
    posicoesOptions.value = posicoes;
    
    // Log para debug - IMPORTANTE: mostra posições carregadas
    console.log('📍 [POSIÇÕES] Carregadas com sucesso:', posicoesOptions.value.length, 'posições');
    
  } catch (error) {
    console.error('❌ [POSIÇÕES] Erro ao carregar:', error);
    mostrarMensagem('Erro ao carregar posições de atendimento', 'error');
    posicoesOptions.value = [];
  } finally {
    loadingPosicoes.value = false;
  }
};

/**
 * Função principal para confirmar atendimento do item
 * 
 * Fluxo:
 * 1. Valida dados obrigatórios
 * 2. Monta dados para APIs
 * 3. Executa movimentação conforme tipo
 * 4. Trata resposta e emite eventos
 */
const confirmarAtendimento = async () => {
  tentouSalvar.value = true;
  
  // ===================================
  // VALIDAÇÕES INICIAIS
  // ===================================
  if (!posicaoSelecionada.value) {
    mostrarMensagem('Por favor, selecione uma posição', 'warning');
    return;
  }

  try {
    loadingAtendimento.value = true;

    // ===================================
    // PREPARAÇÃO DOS DADOS
    // ===================================
    const posicaoEscolhida = posicaoSelecionada.value;
    
    // Monta enderCod: primeiros 4 chars do destino + posição selecionada
    // Ex: "SILO" + "01A" = "SILO01A"
    const enderCod = itemData.value.itOsDestino.substring(0, 4) + posicaoEscolhida;
    
    const dadosComuns = {
      osID: itemData.value.osid,
      osItem: itemData.value.itOSItem,
      empiCod: itemData.value.itOsEmpiCod || "",
      motCod: itemData.value.itOsMotCod || "",
      lote: itemData.value.lote,
      enderCod: enderCod,
      tagEnder: itemData.value.itOsTagEnder || '',
      tagBag: itemData.value.itOsTagBag,
      login: '' // Pode ser preenchido com usuário logado
    };

    // Log para debug - IMPORTANTE: mostra dados que serão enviados
    console.log('📤 [ATENDIMENTO] Dados preparados:', dadosComuns);
    console.log('🔧 [ATENDIMENTO] Tipo de movimentação:', tipoMovimentacao.value);

    let resultado;

    // ===================================
    // EXECUÇÃO POR TIPO DE MOVIMENTAÇÃO
    // ===================================

    if (tipoMovimentacao.value === 'normal') {
      // MOVIMENTAÇÃO NORMAL: pegar + soltar
      console.log('🔄 [MOVIMENTAÇÃO NORMAL] Iniciando processo (pegar + soltar)');
      
      // PASSO 1: Pegar bag
      console.log('📦 [API] Chamando pegarBag...');
      const resultadoPegar = await wmsosStore.pegarBag(dadosComuns);
      
      // Log da resposta - IMPORTANTE: para debug de erros
      console.log('📦 [API] Resposta pegarBag:', resultadoPegar);

      // Verifica erros específicos do pegarBag
      if (resultadoPegar && (
        resultadoPegar.code === 700 || // Moega não disponível
        resultadoPegar.code === 401 || // Não autorizado
        resultadoPegar.code === 404 || // Não encontrado
        resultadoPegar.code === 500    // Erro interno
      )) {
        const mensagemErro = resultadoPegar.message || 'Erro ao executar pegarBag';
        console.log('❌ [API] Erro no pegarBag:', mensagemErro);
        mostrarMensagem(mensagemErro, 'error');
        
        emit('erro-atendimento', {
          erro: mensagemErro,
          item: itemData.value,
          resultado: resultadoPegar
        });
        return;
      }

      // PASSO 2: Soltar bag (só executa se pegar deu certo)
      console.log('📍 [API] Chamando soltarBag...');
      resultado = await wmsosStore.soltarBag(dadosComuns);
      
      // Log da resposta - IMPORTANTE: para debug de erros
      console.log('📍 [API] Resposta soltarBag:', resultado);

      // Verifica erros específicos do soltarBag
      if (resultado && (
        resultado.code === 401 || // Endereço não existe
        resultado.code === 700 || // Moega não disponível
        resultado.code === 404 || // Não encontrado
        resultado.code === 500    // Erro interno
      )) {
        const mensagemErro = resultado.message || 'Erro ao executar soltarBag';
        console.log('❌ [API] Erro no soltarBag:', mensagemErro);
        mostrarMensagem(mensagemErro, 'error');
        
        emit('erro-atendimento', {
          erro: mensagemErro,
          item: itemData.value,
          resultado: resultado
        });
        return;
      }

    } else if (tipoMovimentacao.value === 'corte') {
      // MOVIMENTAÇÃO DE CORTE: cortar bag
      console.log('✂️ [MOVIMENTAÇÃO CORTE] Iniciando processo de corte');
      
      const dadosCorte = {
        osID: dadosComuns.osID,
        osItem: dadosComuns.osItem
      };
      
      console.log('✂️ [API] Chamando cortarBag...');
      resultado = await wmsosStore.cortarBag(dadosCorte);
      
      // Log da resposta - IMPORTANTE: para debug de erros
      console.log('✂️ [API] Resposta cortarBag:', resultado);

      // Verifica erros específicos do cortarBag
      if (resultado && (
        resultado.code === 401 || // Não autorizado
        resultado.code === 700 || // Erro específico
        resultado.code === 404 || // Não encontrado
        resultado.code === 500    // Erro interno
      )) {
        const mensagemErro = resultado.message || 'Erro ao executar cortarBag';
        console.log('❌ [API] Erro no cortarBag:', mensagemErro);
        mostrarMensagem(mensagemErro, 'error');
        
        emit('erro-atendimento', {
          erro: mensagemErro,
          item: itemData.value,
          resultado: resultado
        });
        return;
      }

    } else {
      // TIPO DE MOVIMENTAÇÃO INVÁLIDO
      let mensagemErro = 'Tipo de movimentação não suportado';
      
      if (!itemData.value.itOsDestino) {
        mensagemErro = 'Item sem destino - não é possível realizar a movimentação';
      } else {
        mensagemErro = 'Configuração de item inválida para movimentação';
      }
      
      console.log('❌ [MOVIMENTAÇÃO] Erro de tipo:', mensagemErro);
      console.log('📄 [MOVIMENTAÇÃO] Dados do item:', itemData.value);
      mostrarMensagem(mensagemErro, 'error');
      return;
    }

    // ===================================
    // TRATAMENTO DO RESULTADO FINAL
    // ===================================
    
    // Códigos de sucesso: sem code, 200, 600, ou type Success/Updated
    const isSucesso = resultado && (
      !resultado.code || 
      resultado.code === 200 || 
      resultado.code === 600 || 
      (resultado.type && (resultado.type === 'Updated' || resultado.type === 'Success'))
    );

    if (isSucesso) {
      // SUCESSO
      const mensagem = resultado.message || 'Atendimento realizado com sucesso!';
      console.log('✅ [RESULTADO] Atendimento realizado com sucesso:', mensagem);
      mostrarMensagem(mensagem, 'success');
      
      // Emite evento de sucesso para o componente pai
      emit('atendimento-concluido', {
        item: itemData.value,
        posicao: posicaoSelecionada.value,
        tipo: tipoMovimentacao.value,
        resultado
      });

      // Fecha o modal após 1.5 segundos
      setTimeout(() => {
        fecharModal();
      }, 1500);

    } else {
      // ERRO
      const mensagemErro = resultado?.message || 'Erro ao realizar atendimento';
      console.log('❌ [RESULTADO] Erro no resultado final:', mensagemErro, resultado);
      mostrarMensagem(mensagemErro, 'error');
      
      emit('erro-atendimento', {
        erro: mensagemErro,
        item: itemData.value,
        resultado
      });
    }

  } catch (error) {
    // ===================================
    // TRATAMENTO DE ERROS GERAIS
    // ===================================
    console.error('💥 [ERRO GERAL] Erro no atendimento:', error);
    const mensagemErro = error.message || 'Erro interno ao realizar atendimento';
    mostrarMensagem(mensagemErro, 'error');
    
    emit('erro-atendimento', {
      erro: mensagemErro,
      item: itemData.value,
      error
    });
  } finally {
    loadingAtendimento.value = false;
  }
};

// ===================================
// FUNÇÕES AUXILIARES
// ===================================

/**
 * Fecha o modal e reseta o estado
 */
const fecharModal = () => {
  dialogVisible.value = false;
  posicaoSelecionada.value = null;
  tentouSalvar.value = false;
};
</script>

<style scoped>
/* ===================================
   ESTILOS DO COMPONENTE ATENDER ITEM
   ===================================
   Estilos customizados para o modal de atendimento
*/

/* ===================================
   LAYOUT GERAL
   =================================== */

/* Dialog responsivo com scroll */
.v-dialog > .v-card {
  overflow-y: auto;
  max-height: 90vh;
}

/* ===================================
   CAMPOS DE FORMULÁRIO
   =================================== */

/* Campos readonly com visual diferenciado */
.v-text-field--readonly {
  opacity: 0.8;
}

/* ===================================
   ANIMAÇÕES E TRANSIÇÕES
   =================================== */

/* Transição suave para cards */
.v-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animação fade-in para alertas */
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

/* ===================================
   RESPONSIVIDADE
   =================================== */

/* Ajustes para dispositivos móveis */
@media (max-width: 768px) {
  .v-card-text {
    padding: 16px;
  }
  
  .v-card-actions {
    padding: 16px;
  }
  
  /* Stack de botões em telas pequenas */
  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .v-card-actions .v-btn {
    width: 100%;
  }
  
  .v-spacer {
    display: none;
  }
}

/* Ajustes para tablets */
@media (max-width: 1024px) {
  .v-dialog {
    margin: 16px;
  }
}
</style>
