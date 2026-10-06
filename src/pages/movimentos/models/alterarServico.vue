<!--
  Modal de Alteração de Serviços
  
  Este componente permite ao usuário alterar serviços existentes em uma ordem de serviço.
  O usuário pode selecionar o destino e modificar múltiplos itens antes de finalizar a alteração.
-->
<template>
  <v-dialog v-model="dialogVisible" max-width="1400px" persistent>
    <v-card>
      <!-- Cabeçalho do Modal -->
      <v-card-title class="pa-3 bg-success text-white d-flex align-center">
        <v-icon class="mr-2">mdi-pencil</v-icon>
        <h4>Alterar Serviço</h4>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-row>
          <!-- Seção Principal: Formulário de Dados do Serviço -->
          <v-col cols="12" md="7">
            <v-card elevation="2" class="pa-4">
              <v-card-title class="text-h6 pa-0 mb-4">Dados do Serviço</v-card-title>
              
              <!-- Informações Automáticas: Item, Data e Hora -->
              <v-row class="mb-2">
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Item"
                    v-model="formData.item"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Data"
                    v-model="formData.data"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Hora"
                    v-model="formData.hora"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Tag do Bag"
                    :model-value="formData.tagBag ? formData.tagBag.slice(-6) : ''"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    :placeholder="itemSelecionado ? '' : 'Selecione um item na pesquisa'"
                  />
                </v-col>
              </v-row>

              <!-- Segunda linha: Peso editável e Sacas -->
              <v-row class="mb-2">
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Peso Original (kg)"
                    :model-value="formatarPeso(pesoOriginal)"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="blue-lighten-5"
                    :placeholder="!props.itemSelecionado ? 'Peso original do item' : ''"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Peso (kg)"
                    v-model="formData.peso"
                    type="number"
                    variant="outlined"
                    density="compact"
                    @input="validarECalcularSacasPorPeso"
                    :placeholder="!itemSelecionado ? 'Peso do item selecionado' : ''"
                    :error="erroValidacaoPeso"
                    :error-messages="mensagemErroPeso"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Sacas"
                    v-model="formData.sacas"
                    type="number"
                    variant="outlined"
                    density="compact"
                    @input="validarECalcularPesoPorSacas"
                    :placeholder="!itemSelecionado ? 'Sacas do item selecionado' : ''"
                    :error="erroValidacaoPeso"
                  />
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field
                    label="Lote"
                    v-model="formData.lote"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    :placeholder="itemSelecionado ? '' : 'Selecione um item na pesquisa'"
                  />
                </v-col>
              </v-row>

              <!-- Dados do Item Selecionado: Tag, Lote e Origem -->
              <v-row class="mb-2">
                <v-col cols="12" md="4">
                  <v-text-field
                    label="Origem"
                    v-model="formData.origem"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    :placeholder="itemSelecionado ? '' : 'Selecione um item na pesquisa'"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    label="Bloco Destino"
                    v-model="formData.blocoDestino"
                    :items="opcoesBlocoDestino"
                    item-title="text"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    @update:model-value="onBlocoDestinoChange"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    label="Posição Destino"
                    v-model="formData.posicaoDestino"
                    :items="opcoesPosicaoDestino"
                    item-title="text"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                    :disabled="!formData.blocoDestino"
                  />
                </v-col>
              </v-row>

              <!-- Seleção de Destino: Bloco e Posição -->
              <v-row class="mb-2">


              </v-row>

              <!-- Seleção de Empilhadeira -->
              <v-row class="mb-2">
                <v-col cols="12" md="6">
                  <v-select
                    label="Empilhadeira"
                    v-model="formData.empilhadeira"
                    :items="opcoesEmpilhadeira"
                    item-title="text"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-textarea
                    label="Observação"
                    v-model="formData.observacao"
                    variant="outlined"
                    density="compact"
                    rows="3"
                    no-resize
                  >
                    <template v-slot:append-inner>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="limparObservacao"
                        v-if="formData.observacao"
                      >
                        <v-icon size="16">mdi-close</v-icon>
                      </v-btn>
                    </template>
                  </v-textarea>
                </v-col>
              </v-row>

              <!-- Botões de Ação -->
              <v-row>
                <v-col cols="12" class="text-center">
                  <v-btn
                    color="success"
                    variant="elevated"
                    @click="confirmarAlteracao"
                    prepend-icon="mdi-content-save"
                    size="large"
                    :loading="loading"
                    :disabled="!formValido"
                  >
                    Salvar Alteração
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Tabela de pesquisa removida -->
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Snackbar para Notificações -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="snackbarTimeout"
      location="top"
      multi-line
      persistent
    >
      <div class="d-flex align-center">
        <v-icon 
          :icon="snackbarColor === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'"
          class="mr-2"
        ></v-icon>
        <span v-html="snackbarMessage"></span>
      </div>
      
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
          size="small"
          prepend-icon="mdi-close"
        >
          Fechar
        </v-btn>
        
        <!-- Botão adicional para fechar modal após sucesso -->
        <v-btn
          v-if="snackbarColor === 'success'"
          color="white"
          variant="elevated"
          @click="fecharModalAposSucesso"
          size="small"
          prepend-icon="mdi-check"
          class="ml-2"
        >
          Fechar Modal
        </v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

// Importação dos Stores
import { enderColor } from '@/stores/Consultas/getEnderColor';
import { listaBag } from '@/stores/Consultas/getListaBag';
import { empilhadeira } from '@/stores/Consultas/getEmpilhadeira';
import { WMSOS } from '@/stores/Consultas/setWMSOS';

// ===== PROPRIEDADES E EMISSÃO DE EVENTOS =====

// Props recebidas do componente pai
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dadosOrdemServico: {
    type: Object,
    default: () => ({})
  },
  dadosCompletos: {
    type: Array,
    default: () => []
  },
  itemSelecionado: {
    type: Object,
    default: null
  }
});

// Eventos emitidos para o componente pai
const emit = defineEmits(['update:modelValue', 'confirmar']);

// ===== INSTÂNCIAS DOS STORES =====

const enderColorStore = enderColor();
const listaBagStore = listaBag();
const empilhadeiraStore = empilhadeira();
const wmSOSStore = WMSOS();

// ===== VARIÁVEIS REATIVAS =====

// Controle do Modal
const dialogVisible = ref(props.modelValue);
const loading = ref(false);
const loadingPesquisa = ref(false);

// Controle de Notificações
const showSnackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');
const snackbarTimeout = ref(-1); // -1 significa sem timeout automático

// Campos de Pesquisa
const pesquisaLote = ref('');
const pesquisaTagBag = ref('');

// Lista de itens que serão enviados para a API
const itensAcumulados = ref([]);

// Dados do formulário principal
const formData = ref({
  item: '',
  data: '',
  hora: '',
  tagBag: '',
  lote: '',
  peso: '',
  sacas: '',
  origem: '',
  blocoDestino: '',
  posicaoDestino: '',
  empilhadeira: '',
  observacao: ''
});

// Opções para os campos de seleção
const opcoesBlocoDestino = ref([]);
const opcoesPosicaoDestino = ref([]);
const todosEnderecos = ref([]); // Armazena todos os endereços da API
const opcoesEmpilhadeira = ref([]);
const opcoesMoega = ref([]);

// Dados da pesquisa
const resultadosPesquisa = ref([]);
const itemSelecionado = ref(null);

// Controle do peso original para detectar alterações
const pesoOriginal = ref(null);

// Variáveis para validação de peso
const erroValidacaoPeso = ref(false);
const mensagemErroPeso = ref('');

// ===== CONFIGURAÇÕES DA TABELA =====

// Cabeçalhos da tabela de pesquisa
const headersPesquisa = [
  {
    title: 'Lote',
    key: 'lote',
    align: 'start',
    sortable: true
  },
  {
    title: 'Tag Bag',
    key: 'tagBag',
    align: 'start',
    sortable: true
  },
  {
    title: 'Peso (kg)',
    key: 'peso',
    align: 'start',
    sortable: true
  },
  {
    title: 'Sacas',
    key: 'sacas',
    align: 'start',
    sortable: true
  },
  {
    title: 'Endereço Atual',
    key: 'endereco',
    align: 'start',
    sortable: true
  },
  {
    title: 'Status',
    key: 'status',
    align: 'start',
    sortable: true
  }
];

// ===== REGRAS DE VALIDAÇÃO =====

const rules = {
  required: value => !!value || 'Campo obrigatório'
};

// ===== PROPRIEDADES COMPUTADAS =====

// Verifica se o formulário está válido para submissão
const formValido = computed(() => {
  return formData.value.blocoDestino && 
         formData.value.posicaoDestino &&
         (itemSelecionado.value !== null || props.itemSelecionado !== null);
});

// ===== WATCHERS =====

// Sincroniza o v-model com o estado interno
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal) {
    inicializarFormulario();
  }
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

// Atualiza o formulário quando um item é selecionado
watch(itemSelecionado, (newVal) => {
  if (newVal) {
    preencherFormularioComItem(newVal);
  } else {
    // Limpa campos relacionados aos itens quando nenhum item está selecionado
    formData.value.tagBag = '';
    formData.value.lote = '';
    formData.value.peso = '';
    formData.value.sacas = '';
    formData.value.origem = '';
  }
});

// ===== FUNÇÕES DE INICIALIZAÇÃO =====

/**
 * Inicializa o formulário com valores padrão e carrega dados necessários
 */
const inicializarFormulario = () => {
  console.log('🚀 Inicializando formulário com item selecionado:', props.itemSelecionado);
  
  // Se há um item selecionado, preenche os dados
  if (props.itemSelecionado) {
    preencherFormularioComItemSelecionado(props.itemSelecionado);
  } else {
    // Caso contrário, gera o próximo número de item automaticamente
    formData.value.item = gerarProximoItem();
    
    // Define data e hora atuais
    const agora = new Date();
    formData.value.data = formatarDataAtual(agora);
    formData.value.hora = formatarHoraAtual(agora);
    
    // Limpa todos os outros campos
    formData.value.tagBag = '';
    formData.value.lote = '';
    formData.value.peso = '';
    formData.value.sacas = '';
    formData.value.origem = '';
    formData.value.observacao = '';
  }
  
  // Sempre limpa os campos de destino e empilhadeira para permitir alteração
  formData.value.blocoDestino = '';
  formData.value.posicaoDestino = '';
  formData.value.empilhadeira = '';
  
  // Limpa pesquisa e seleções
  pesquisaLote.value = '';
  pesquisaTagBag.value = '';
  resultadosPesquisa.value = [];
  itemSelecionado.value = null;
  itensAcumulados.value = [];
  
  // Carrega dados dos selects
  carregarBlocosDestino();
  carregarEmpilhadeiras();
};

/**
 * Gera o próximo número de item baseado nos itens existentes
 */
const gerarProximoItem = () => {
  let maiorItem = 0;
  
  // Verifica itens existentes da OS atual
  if (props.dadosOrdemServico.osid && props.dadosCompletos.length > 0) {
    const itensOS = props.dadosCompletos.filter(item => 
      item.osid === props.dadosOrdemServico.osid
    );
    
    if (itensOS.length > 0) {
      maiorItem = Math.max(...itensOS.map(item => {
        const numItem = parseInt(item.itOSItem) || 0;
        return numItem;
      }));
    }
  }
  
  // Verifica itens já acumulados nesta sessão
  if (itensAcumulados.value.length > 0) {
    const maiorItemAcumulado = Math.max(...itensAcumulados.value.map(item => {
      const numItem = parseInt(item.ItOSItem) || 0;
      return numItem;
    }));
    maiorItem = Math.max(maiorItem, maiorItemAcumulado);
  }

  // Retorna o próximo número formatado com 3 dígitos
  const proximoItem = maiorItem + 1;
  return String(proximoItem).padStart(3, '0');
};

// ===== FUNÇÕES DE FORMATAÇÃO =====

/**
 * Formata a data atual para o padrão brasileiro (DD/MM/AAAA)
 */
const formatarDataAtual = (date) => {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

/**
 * Formata a hora atual para o padrão HH:MM:SS
 */
const formatarHoraAtual = (date) => {
  const hora = String(date.getHours()).padStart(2, '0');
  const minuto = String(date.getMinutes()).padStart(2, '0');
  return `${hora}:${minuto}`;
};

/**
 * Formata valores de peso para exibição
 */
const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Formata valores de sacas para exibição
 */
const formatarSacas = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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

/**
 * Formata hora do formato HHMMSS ou HHMM para HH:MM para o formulário
 */
const formatarHoraParaFormulario = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && value.length === 6 && /^\d{6}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    return `${hour}:${minute}`;
  }
  if (typeof value === 'string' && value.length === 4 && /^\d{4}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    return `${hour}:${minute}`;
  }
  return value;
};

/**
 * Converte data do formato YYYYMMDD para DD/MM/AAAA para envio na API
 */
const converterDataParaAPI = (value) => {
  if (!value) return '';
  // Se já estiver no formato DD/MM/AAAA, retorna como está
  if (typeof value === 'string' && value.includes('/')) {
    return value;
  }
  // Se estiver no formato YYYYMMDD, converte para DD/MM/AAAA
  if (typeof value === 'string' && value.length === 8 && /^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return value;
};

/**
 * Calcula sacas baseado no peso (peso/59)
 */
const calcularSacasPorPeso = (event) => {
  const peso = parseFloat(event.target.value) || 0;
  const sacas = peso / 59;
  formData.value.sacas = sacas.toFixed(2);
  
  // Verifica se o peso foi alterado e atualiza a observação
  verificarAlteracaoPeso(peso);
};

/**
 * Verifica se o peso foi alterado e atualiza a observação automaticamente
 */
const verificarAlteracaoPeso = (novodPeso) => {
  if (pesoOriginal.value !== null && pesoOriginal.value !== novodPeso && novodPeso > 0) {
    const observacaoAtual = formData.value.observacao || '';
    
    // Remove qualquer observação de "*** PARTE ***" anterior
    const observacaoLimpa = observacaoAtual.replace(/\*\*\* PARTE \*\*\* \(\d+(?:\.\d+)?kg\)/g, '').trim();
    
    // Adiciona a nova observação
    const novaObservacao = `*** PARTE *** (${novodPeso}kg)`;
    
    // Combina as observações
    if (observacaoLimpa) {
      formData.value.observacao = `${observacaoLimpa} ${novaObservacao}`;
    } else {
      formData.value.observacao = novaObservacao;
    }
  }
};

/**
 * Calcula peso baseado nas sacas (sacas*59)
 */
const calcularPesoPorSacas = (event) => {
  const sacas = parseFloat(event.target.value) || 0;
  const peso = sacas * 59;
  formData.value.peso = peso.toFixed(2);
  
  // Verifica se o peso foi alterado e atualiza a observação
  verificarAlteracaoPeso(peso);
};

/**
 * Valida o peso informado e calcula sacas automaticamente
 */
const validarECalcularSacasPorPeso = (event) => {
  let peso = parseFloat(event.target.value) || 0;
  
  // Se o peso for maior que o original, ajusta automaticamente para o peso original
  if (pesoOriginal.value && peso > pesoOriginal.value) {
    peso = pesoOriginal.value;
    formData.value.peso = peso.toString();
    erroValidacaoPeso.value = false;
    mensagemErroPeso.value = '';
  } else {
    erroValidacaoPeso.value = false;
    mensagemErroPeso.value = '';
  }
  
  // Calcula sacas baseado no peso
  const sacas = peso / 59;
  formData.value.sacas = sacas.toFixed(2);
  
  // Verifica se o peso foi alterado e atualiza a observação
  verificarAlteracaoPeso(peso);
};

/**
 * Valida o peso calculado pelas sacas
 */
const validarECalcularPesoPorSacas = (event) => {
  const sacas = parseFloat(event.target.value) || 0;
  let peso = sacas * 59;
  
  // Se o peso calculado for maior que o original, ajusta automaticamente para o peso original
  if (pesoOriginal.value && peso > pesoOriginal.value) {
    peso = pesoOriginal.value;
    formData.value.peso = peso.toFixed(2);
    // Recalcula as sacas baseado no peso original
    const sacasAjustadas = peso / 59;
    formData.value.sacas = sacasAjustadas.toFixed(2);
    erroValidacaoPeso.value = false;
    mensagemErroPeso.value = '';
  } else {
    erroValidacaoPeso.value = false;
    mensagemErroPeso.value = '';
    // Atualiza o peso calculado normalmente
    formData.value.peso = peso.toFixed(2);
  }
  
  // Verifica se o peso foi alterado e atualiza a observação
  verificarAlteracaoPeso(peso);
};

/**
 * Limpa o campo de observação
 */
const limparObservacao = () => {
  formData.value.observacao = '';
};

// ===== FUNÇÕES DE CARREGAMENTO DE DADOS =====

/**
 * Carrega as empilhadeiras disponíveis da API
 */
const carregarEmpilhadeiras = async () => {
  try {
    const response = await empilhadeiraStore.empilhadeira();
    
    if (response && Array.isArray(response)) {
      opcoesEmpilhadeira.value = response.map(emp => ({
        text: emp.empidescr,
        value: emp.empicod
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar empilhadeiras:', error);
  }
};

/**
 * Carrega os blocos de destino disponíveis da API
 */
const carregarBlocosDestino = async () => {
  try {
    const response = await enderColorStore.enderColor();
    
    if (response && Array.isArray(response)) {
      todosEnderecos.value = response;
      
      // Extrai os blocos únicos (primeiros 3 números do enderCod)
      const blocosUnicos = new Set();
      const moegasUnicas = new Set();
      
      response.forEach(item => {
        if (item.enderCod && item.enderCod.length >= 3) {
          // Para blocos normais (3 dígitos)
          const bloco = item.enderCod.substring(0, 3);
          if (/^\d{3}$/.test(bloco)) {
            blocosUnicos.add(bloco);
          }
          
          // Para moegas (que começam com M)
          if (item.enderCod.startsWith('M')) {
            moegasUnicas.add(item.enderCod);
          }
        }
      });
      
      // Converte blocos para array de opções e ordena
      const opcoesBloco = Array.from(blocosUnicos)
        .sort()
        .map(bloco => ({
          text: `${bloco}`,
          value: bloco
        }));
      
      // Adiciona opção "Moega" se houver moegas disponíveis
      if (moegasUnicas.size > 0) {
        opcoesBloco.push({
          text: 'Moega',
          value: 'MOEGA'
        });
      }
      
      opcoesBlocoDestino.value = opcoesBloco;
      
      // Armazena moegas para uso posterior
      opcoesMoega.value = Array.from(moegasUnicas)
        .sort()
        .map(moega => ({
          text: moega,
          value: moega
        }));
    }
  } catch (error) {
    console.error('Erro ao carregar blocos de destino:', error);
  }
};

/**
 * Atualiza as opções de posição baseado no bloco selecionado
 */
const onBlocoDestinoChange = () => {
  if (!formData.value.blocoDestino) {
    opcoesPosicaoDestino.value = [];
    formData.value.posicaoDestino = '';
    return;
  }
  
  if (formData.value.blocoDestino === 'MOEGA') {
    // Se selecionou "Moega", mostra todas as moegas disponíveis
    opcoesPosicaoDestino.value = opcoesMoega.value;
  } else {
    // Se selecionou um bloco numérico, filtra endereços que começam com o bloco
    const enderecosFiltrados = todosEnderecos.value.filter(item => 
      item.enderCod && item.enderCod.startsWith(formData.value.blocoDestino)
    );
    
    // Cria opções de posição ordenadas
    opcoesPosicaoDestino.value = enderecosFiltrados
      .map(item => ({
        text: item.enderCod,
        value: item.enderCod
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }
  
  // Limpa posição selecionada
  formData.value.posicaoDestino = '';
};

// ===== FUNÇÕES DE PESQUISA =====

/**
 * Pesquisa itens por lote
 */
const pesquisarPorLote = async () => {
  // Limpa a pesquisa por tag bag quando pesquisa por lote
  if (pesquisaLote.value) {
    pesquisaTagBag.value = '';
  }

  if (!pesquisaLote.value || pesquisaLote.value.length < 3) {
    resultadosPesquisa.value = [];
    return;
  }

  loadingPesquisa.value = true;
  
  try {
    // Primeiro, tenta buscar no getListaBag
    const listaBagResponse = await listaBagStore.listaBag({ lote: pesquisaLote.value });
    
    if (listaBagResponse && Array.isArray(listaBagResponse) && listaBagResponse.length > 0) {
      // Se encontrou dados no getListaBag, usa esses dados
      resultadosPesquisa.value = listaBagResponse.map((item, index) => ({
        id: index + 1,
        uniqueId: `lote_${item.bagLote}_${item.bagTag}_${index}`,
        lote: item.bagLote || pesquisaLote.value,
        tagBag: item.bagTag || '',
        peso: parseFloat(item.bagKgAtu) || 0,
        sacas: (parseFloat(item.bagKgAtu) / 59).toFixed(2) || 0,
        origem: item.bagAtuEnder || '',
        destino: item.bagUltEnder || '',
        endereco: item.bagAtuEnder || '',
        status: item.bagStatus || ''
      }));
    } else {
      // Se não encontrou no getListaBag, tenta no enderColor como fallback
      const response = await enderColorStore.enderColor({ lote: pesquisaLote.value });
      
      if (response && Array.isArray(response)) {
        resultadosPesquisa.value = response.map((item, index) => ({
          id: index + 1,
          uniqueId: `endercolor_${item.bagLote}_${item.enderTag}_${index}`,
          lote: item.bagLote || '',
          tagBag: item.enderTag || '',
          peso: parseFloat(item.enderSacas) * 59 || 0,
          sacas: parseFloat(item.enderSacas) || 0,
          origem: item.enderCod || '',
          destino: item.enderCod || '',
          endereco: item.enderCod || '',
          status: item.enderStatus || ''
        }));
      } else {
        resultadosPesquisa.value = [];
      }
    }
    
  } catch (error) {
    console.error('Erro ao pesquisar por lote:', error);
    resultadosPesquisa.value = [];
  } finally {
    loadingPesquisa.value = false;
  }
};

/**
 * Pesquisa itens por tag bag
 */
const pesquisarPorTagBag = async () => {
  // Limpa a pesquisa por lote quando pesquisa por tag bag
  if (pesquisaTagBag.value) {
    pesquisaLote.value = '';
  }

  if (!pesquisaTagBag.value || pesquisaTagBag.value.length < 3) {
    resultadosPesquisa.value = [];
    return;
  }

  loadingPesquisa.value = true;
  
  try {
    let tagBagCompleta = pesquisaTagBag.value;
    
    // Se o usuário digitou apenas números (ex: 103398), completa com o prefixo
    if (/^\d+$/.test(pesquisaTagBag.value)) {
      tagBagCompleta = `666571000000000000${pesquisaTagBag.value}`;
    }

    const response = await enderColorStore.enderColor({ tagBag: tagBagCompleta });
    
    if (response && Array.isArray(response)) {
      resultadosPesquisa.value = response.map((item, index) => ({
        id: index + 1,
        uniqueId: `tagbag_${tagBagCompleta}_${item.bagLote}_${index}`,
        lote: item.bagLote || '',
        tagBag: tagBagCompleta, 
        peso: parseFloat(item.enderSacas) * 59 || 0,
        sacas: parseFloat(item.enderSacas) || 0,
        origem: item.enderCod || '',
        destino: item.enderCod || '',
        endereco: item.enderCod || '',
        status: item.enderStatus || ''
      }));
    } else {
      resultadosPesquisa.value = [];
    }
    
  } catch (error) {
    console.error('Erro ao pesquisar por tag bag:', error);
    resultadosPesquisa.value = [];
  } finally {
    loadingPesquisa.value = false;
  }
};

/**
 * Limpa a pesquisa por lote
 */
const limparPesquisaLote = () => {
  pesquisaLote.value = '';
  resultadosPesquisa.value = [];
  itemSelecionado.value = null;
};

/**
 * Limpa a pesquisa por tag bag
 */
const limparPesquisaTagBag = () => {
  pesquisaTagBag.value = '';
  resultadosPesquisa.value = [];
  itemSelecionado.value = null;
};

// ===== FUNÇÕES DE MANIPULAÇÃO DE DADOS =====

/**
 * Preenche o formulário com os dados do item selecionado
 */
const preencherFormularioComItem = (item) => {
  if (!item) return;
  formData.value.tagBag = item?.tagBag || '';
  formData.value.lote = item?.lote || '';
  formData.value.peso = item?.peso ? item.peso.toString() : '';
  formData.value.sacas = item?.sacas ? item.sacas.toString() : '';
  formData.value.origem = item?.endereco || '';
  
  // Armazena o peso original para detectar alterações
  pesoOriginal.value = item?.peso || null;
};

/**
 * Preenche o formulário com os dados do item selecionado na tabela de detalhes
 */
const preencherFormularioComItemSelecionado = async (item) => {
  if (!item) return;
  
  console.log('🔍 Preenchendo formulário com item selecionado:', item);
  console.log('🔍 Observação do item (itOsObs):', item.itOsObs);
  
  // Calcula o peso original: se houver observação E não começar com "* CORT FOR *" nem com "***GERADO C",
  // então soma itOsPeso + itOsPesoSoltar. Caso contrário, usa apenas itOsPeso.
  // Preenche com os dados do item selecionado (campos readonly)
  formData.value.item = item.itOSItem || '';
  formData.value.data = formatarDataParaFormulario(item.itOSData) || '';
  formData.value.hora = formatarHoraParaFormulario(item.itOSHora) || '';
  formData.value.tagBag = item.itOsTagBag || '';
  formData.value.lote = item.lote || '';
  formData.value.peso = item.itOsPeso ? item.itOsPeso.toString() : '';
  formData.value.sacas = item.itOsPeso ? (item.itOsPeso / 59).toFixed(2) : '';
  formData.value.origem = item.itOsOrigem || '';
  
  // Preenche os campos que podem ser alterados com os valores atuais
  formData.value.observacao = item.itOsObs || '';
  
  console.log('✅ Observação preenchida no formData:', formData.value.observacao);
  
  // Armazena o peso original calculado para detectar alterações
  pesoOriginal.value = null;
  await carregarPesoOriginalPorTagBag(item.itOsTagBag);
  
  // Tenta preencher bloco e posição de destino baseado no destino atual
  if (item.itOsDestino) {
    setTimeout(() => {
      preencherDestinoDoItem(item.itOsDestino);
    }, 500); // Aguarda carregar as opções
  }
};

/**
 * Preenche bloco e posição destino baseado no endereço do item
 */
const carregarPesoOriginalPorTagBag = async (tagBag) => {
  if (!tagBag) {
    pesoOriginal.value = null;
    return;
  }

  const tagbag = tagBag.toString().slice(-6);

  try {
    const response = await listaBagStore.listaBag({ tagbag });
    const bag = Array.isArray(response) ? response[0] : null;
    pesoOriginal.value = bag?.bagKgAtu !== undefined && bag?.bagKgAtu !== null
      ? parseFloat(bag.bagKgAtu)
      : null;
  } catch (error) {
    console.error('Erro ao buscar peso original pela tag bag:', error);
    pesoOriginal.value = null;
  }
};

const preencherDestinoDoItem = (destino) => {
  if (!destino) return;
  
  // Se for moega (começa com M)
  if (destino.startsWith('M')) {
    formData.value.blocoDestino = 'MOEGA';
    onBlocoDestinoChange();
    setTimeout(() => {
      formData.value.posicaoDestino = destino;
    }, 100);
  } else if (destino.length >= 3) {
    // Para endereços normais, extrai o bloco (primeiros 3 dígitos)
    const bloco = destino.substring(0, 3);
    if (/^\d{3}$/.test(bloco)) {
      formData.value.blocoDestino = bloco;
      onBlocoDestinoChange();
      setTimeout(() => {
        formData.value.posicaoDestino = destino;
      }, 100);
    }
  }
};

/**
 * Retorna a cor do status baseado no valor
 */
const getStatusColor = (status) => {
  switch (status) {
    case 'OC': return 'success';
    case 'LI': return 'warning';
    case 'BL': return 'error';
    case 'DP': return 'info';
    default: return 'grey';
  }
};

// ===== FUNÇÕES DE CONTROLE DE SELEÇÃO =====

/**
 * Verifica se um item está selecionado
 */
const isItemSelected = (item) => {
  return itemSelecionado.value?.uniqueId === item.uniqueId;
};

/**
 * Seleciona ou desseleciona um item
 */
const selecionarItem = (item) => {
  if (itemSelecionado.value?.uniqueId === item.uniqueId) {
    // Se clicar no mesmo item, desseleciona
    itemSelecionado.value = null;
  } else {
    // Seleciona o novo item
    itemSelecionado.value = item;
  }
};

// ===== FUNÇÕES DE NOTIFICAÇÃO =====

/**
 * Exibe uma notificação para o usuário
 */
const mostrarNotificacao = (tipo, titulo, mensagem, dados = null, timeout = -1) => {
  let conteudo = `
    <div class="text-h6 mb-2">
      <v-icon icon="${tipo === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'}" class="mr-2"></v-icon>
      ${titulo}
    </div>
    <div class="text-body-2">
      ${mensagem}
    </div>
  `;
  
  if (dados) {
    conteudo += `
      <div class="text-body-2 mt-1">
        <strong>Número de Registro:</strong> ${dados}
      </div>
    `;
  }
  
  snackbarMessage.value = conteudo;
  snackbarColor.value = tipo;
  snackbarTimeout.value = timeout;
  showSnackbar.value = true;
};

// ===== FUNÇÕES DE ALTERAÇÃO DE ITENS =====

/**
 * Confirma a alteração e salva no JSON pai
 */
const confirmarAlteracao = () => {
  if (!formValido.value) {
    return;
  }

  loading.value = true;
  
  // Usa dados do item selecionado na tabela ou do item pesquisado
  const itemOriginal = props.itemSelecionado || itemSelecionado.value;
  
  if (!itemOriginal) {
    alert('Nenhum item selecionado para alteração');
    loading.value = false;
    return;
  }

  try {
    // O peso digitado vai para ItOsPeso, o restante vai para ItOsPesoSoltar
    const pesoDigitado = parseFloat(formData.value.peso) || 0;
    
    // Se o item já teve uma parte feita antes (tem itOsPesoSoltar > 0), soma os dois para ter o peso total original
    const pesoOriginalItem = parseFloat(pesoOriginal.value) || parseFloat(itemOriginal.itOsPeso) || 0;
    
    const pesoRestante = pesoOriginalItem - pesoDigitado;
    // Obter dados originais da OS
    const osid = props.dadosOrdemServico?.osid || "";
    const motCod = props.dadosOrdemServico?.motCod || "";

    // Obter todos os itens da OS atual (originais)
    const todosItensOriginais = props.dadosCompletos.filter(item => 
      item.osid === osid
    );

    // Criar item alterado em formato minúsculo
    const itemAlterado = {
      osid: osid,
      itOSItem: formData.value.item || "",
      opTck: osid,
      empiCod: formData.value.empilhadeira,
      motCod: motCod,
      itOSData: itemOriginal.itOSData || "",
      itOSHora: itemOriginal.itOSHora || "",
      itOsTagBag: itemOriginal.itOsTagBag || "",
      itOsOrigem: itemOriginal.itOsOrigem || "",
      itOsTagOrigem: itemOriginal.itOsTagOrigem || "",
      itOsDestino: formData.value.posicaoDestino,
      itOsTagDestino: formData.value.blocoDestino === 'MOEGA' ? formData.value.posicaoDestino : "",
      itOSStatus: "AB",
      lote: itemOriginal.lote || "",
      itOsObs: formData.value.observacao || "",
      itOsPeso: pesoDigitado,
      itOsPesoSoltar: pesoRestante
    };

    // Montar array final: item alterado + itens originais não alterados
    const todosItens = todosItensOriginais.map(itemOriginalOS => {
      if (itemOriginalOS.itOSItem === itemAlterado.itOSItem) {
        // Substitui pelo item alterado
        return itemAlterado;
      } else {
        // Mantém o item original
        return itemOriginalOS;
      }
    });

    console.log('✅ Salvando alteração - Dados preparados:');
    console.log('� Item alterado:', itemAlterado);
    console.log('� Total de itens (com originais):', todosItens.length);

    // Emite evento com os dados formatados
    emit('confirmar', {
      itensAlterados: [itemAlterado], // Array com o item alterado
      todosItens: todosItens // Todos os itens (alterado + originais)
    });

    // Fecha o modal
    dialogVisible.value = false;
    
  } catch (error) {
    console.error('❌ Erro ao salvar alteração:', error);
    alert(`Erro ao processar alteração:\n${error.message}`);
  } finally {
    loading.value = false;
  }
};

/**
 * Limpa campos do formulário para inclusão de novo item
 */
const limparCamposParaNovoItem = () => {
  // Atualiza o campo item para o próximo número
  formData.value.item = gerarProximoItem();
  
  // Limpa seleção atual
  itemSelecionado.value = null;
  
  // Limpa apenas os campos relacionados ao item
  formData.value.tagBag = '';
  formData.value.lote = '';
  formData.value.peso = '';
  formData.value.sacas = '';
  formData.value.origem = '';
  formData.value.observacao = '';
  
  // Limpa o peso original
  pesoOriginal.value = null;
  
  // Mantém os campos fixos (bloco destino, posição destino, empilhadeira)
  // para facilitar a inclusão de múltiplos itens para o mesmo destino
};

/**
 * Finaliza a alteração e retorna dados para o componente pai
 * NOTA: Função não utilizada - alteração é salva diretamente via confirmarAlteracao
 */
/*
const finalizarAlteracao = () => {
  if (itensAcumulados.value.length === 0) {
    alert('Nenhuma alteração foi feita.');
    return;
  }

  loading.value = true;

  try {
    // Obter dados originais da OS
    const osid = props.dadosOrdemServico?.osid || "";

    // Obter todos os itens da OS atual (originais)
    const todosItensOriginais = props.dadosCompletos.filter(item => 
      item.osid === osid
    );

    // Criar mapa dos itens alterados por número do item
    const itensAlteradosMap = new Map();
    itensAcumulados.value.forEach(item => {
      itensAlteradosMap.set(item.ItOSItem, item);
    });

    // Montar array final: itens alterados + itens originais não alterados
    const todosItens = todosItensOriginais.map(itemOriginal => {
      const itemAlterado = itensAlteradosMap.get(itemOriginal.itOSItem);
      
      if (itemAlterado) {
        // Se foi alterado NESTA sessão, retorna item alterado em formato minúsculo
        return {
          osid: osid,
          itOSItem: itemAlterado.ItOSItem,
          opTck: itemAlterado.OpTck,
          empiCod: itemAlterado.EmpiCod,
          motCod: itemAlterado.MotCod,
          itOSData: itemAlterado.ItOSData,
          itOSHora: itemAlterado.ItOSHora,
          itOsTagBag: itemAlterado.ItOsTagBag,
          itOsOrigem: itemAlterado.ItOsOrigem,
          itOsTagOrigem: itemAlterado.ItOsTagOrigem,
          itOsDestino: itemAlterado.ItOsDestino,
          itOsTagDestino: itemAlterado.ItOsTagDestino,
          itOSStatus: itemAlterado.ItOSStatus,
          lote: itemAlterado.Lote,
          itOsObs: itemAlterado.ItOsObs,
          itOsPeso: parseFloat(itemAlterado.ItOsPeso) || 0,
          itOsPesoSoltar: parseFloat(itemAlterado.ItOsPesoSoltar) || 0
        };
      } else {
        // Se NÃO foi alterado, mantém os dados originais
        return itemOriginal;
      }
    });

    // Array apenas com os itens que foram alterados (para log)
    const itensAlterados = itensAcumulados.value.map(item => ({
      osid: osid,
      itOSItem: item.ItOSItem,
      opTck: item.OpTck,
      empiCod: item.EmpiCod,
      motCod: item.MotCod,
      itOSData: item.ItOSData,
      itOSHora: item.ItOSHora,
      itOsTagBag: item.ItOsTagBag,
      itOsOrigem: item.ItOsOrigem,
      itOsTagOrigem: item.ItOsTagOrigem,
      itOsDestino: item.ItOsDestino,
      itOsTagDestino: item.ItOsTagDestino,
      itOSStatus: item.ItOSStatus,
      lote: item.Lote,
      itOsObs: item.ItOsObs,
      itOsPeso: parseFloat(item.ItOsPeso) || 0,
      itOsPesoSoltar: parseFloat(item.ItOsPesoSoltar) || 0
    }));

    console.log('✅ Finalizando alteração - Dados preparados:');
    console.log('� Itens alterados:', itensAlterados.length);
    console.log('� Total de itens (com originais):', todosItens.length);

    // Emite evento com os dados formatados
    emit('confirmar', {
      itensAlterados: itensAlterados, // Apenas os alterados
      todosItens: todosItens // Todos os itens (alterados + originais)
    });

    // Fecha o modal
    dialogVisible.value = false;
    
  } catch (error) {
    console.error('❌ Erro ao finalizar alteração:', error);
    alert(`Erro ao processar alteração:\n${error.message}`);
  } finally {
    loading.value = false;
  }
};
*/

/**
 * Remove um item da lista acumulada
 * NOTA: Função não utilizada - não há mais lista acumulada
 */
/*
const removerItemAcumulado = (index) => {
  itensAcumulados.value.splice(index, 1);
};
*/

/**
 * Fecha o modal
 */
const fecharModal = () => {
  dialogVisible.value = false;
  showSnackbar.value = false; // Também fecha qualquer notificação ativa
};

/**
 * Fecha o modal após sucesso, mantendo a notificação visível por um momento
 */
const fecharModalAposSucesso = () => {
  showSnackbar.value = false;
  fecharModal();
};

// ===== LIFECYCLE HOOKS =====

onMounted(() => {
  carregarBlocosDestino();
  carregarEmpilhadeiras();
});
</script>
<style scoped>
/* ===== ESTILOS CUSTOMIZADOS ===== */

/* Configurações da Tabela de Pesquisa */
.tabela-pesquisa {
  max-height: 400px;
}

.tabela-pesquisa :deep(.v-data-table__wrapper) {
  max-height: 350px;
}

.tabela-pesquisa :deep(.v-data-table-header th) {
  background-color: #2196f3 !important;
  color: white !important;
  font-weight: 600;
  font-size: 0.85rem !important;
}

.tabela-pesquisa :deep(.v-data-table-header th .v-data-table-header__content) {
  color: white;
}

.tabela-pesquisa :deep(.v-data-table__td) {
  font-size: 0.85rem !important;
  padding: 8px 12px !important;
}

/* Estados de Interação */
.cursor-pointer {
  cursor: pointer;
}

.selected-row {
  background-color: #e3f2fd !important;
}

.selected-row:hover {
  background-color: #bbdefb !important;
}

/* Containers de Status */
.loading-container {
  text-align: center;
  padding: 40px 20px;
}

.no-data-container {
  text-align: center;
  padding: 40px 20px;
}

/* Campos Readonly */
.v-text-field--readonly :deep(.v-field__input) {
  color: #666 !important;
}

/* Container dos Itens Adicionados */
.itens-adicionados-container {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  background-color: #fafafa;
}

/* Responsividade */
@media (max-width: 768px) {
  .v-dialog {
    margin: 12px;
  }
}
</style>
