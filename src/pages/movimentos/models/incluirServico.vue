<!--
  Modal de Inclusão de Serviços
  
  Este componente permite ao usuário incluir novos serviços em uma ordem de serviço.
  O usuário pode pesquisar itens por lote ou tag bag, selecionar o destino e adicionar
  múltiplos itens antes de finalizar a inclusão.
-->
<template>
  <v-dialog v-model="dialogVisible" max-width="1400px" persistent>
    <v-card>
      <!-- Cabeçalho do Modal -->
      <v-card-title class="pa-3 bg-success text-white d-flex align-center">
        <v-icon class="mr-2">mdi-plus</v-icon>
        <h4>Incluir Serviço</h4>
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
                <v-col cols="12" md="4">
                  <v-text-field
                    label="Item"
                    v-model="formData.item"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="Data"
                    v-model="formData.data"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    label="Hora"
                    v-model="formData.hora"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                  />
                </v-col>
              </v-row>

              <!-- Dados do Item Selecionado: Tag, Lote e Origem -->
              <v-row class="mb-2">
                <v-col cols="12" md="4">
                  <v-text-field
                    label="Tag do Bag"
                    v-model="formData.tagBag"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    :placeholder="itemSelecionado ? '' : 'Selecione um item na pesquisa'"
                  />
                </v-col>
                <v-col cols="12" md="4">
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
              </v-row>

              <!-- Informações de Peso e Quantidade -->
              <v-row class="mb-2">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Peso Total (kg)"
                    v-model="formData.peso"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    :placeholder="!itemSelecionado ? 'Peso do item selecionado' : ''"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Sacas Totais"
                    v-model="formData.sacas"
                    readonly
                    variant="outlined"
                    density="compact"
                    bg-color="grey-lighten-4"
                    :placeholder="!itemSelecionado ? 'Sacas do item selecionado' : ''"
                  />
                </v-col>
              </v-row>

              <!-- Seleção de Destino: Bloco e Posição -->
              <v-row class="mb-2">
                <v-col cols="12" md="6">
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
                <v-col cols="12" md="6">
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

              <!-- Seleção de Empilhadeira -->
              <v-row class="mb-2">
                <v-col cols="12">
                  <v-select
                    label="Empilhadeira"
                    v-model="formData.empilhadeira"
                    :items="opcoesEmpilhadeira"
                    item-title="text"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    :rules="[rules.required]"
                  />
                </v-col>
              </v-row>

              <!-- Campo Opcional de Observação -->
              <v-row class="mb-4">
                <v-col cols="12">
                  <v-textarea
                    label="Observação"
                    v-model="formData.observacao"
                    variant="outlined"
                    density="compact"
                    rows="3"
                    no-resize
                  />
                </v-col>
              </v-row>

              <!-- Botões de Ação -->
              <v-row>
                <v-col cols="12" class="text-center">
                  <v-btn
                    color="primary"
                    variant="elevated"
                    @click="confirmarInclusao"
                    prepend-icon="mdi-plus"
                    size="large"
                    :loading="loading"
                    :disabled="!formValido"
                    class="mr-3"
                  >
                    Adicionar Item
                    <span v-if="itemSelecionado" class="ml-2">
                      (1 item)
                    </span>
                  </v-btn>

                  <v-btn
                    color="success"
                    variant="elevated"
                    @click="finalizarInclusao"
                    prepend-icon="mdi-check-all"
                    size="large"
                    :loading="loading"
                    :disabled="itensAcumulados.length === 0"
                  >
                    Finalizar Inclusão
                    <span v-if="itensAcumulados.length > 0" class="ml-2">
                      ({{ itensAcumulados.length }} {{ itensAcumulados.length === 1 ? 'item' : 'itens' }})
                    </span>
                  </v-btn>
                </v-col>
              </v-row>

              <!-- Exibição dos Itens Adicionados -->
              <v-row v-if="itensAcumulados.length > 0" class="mt-4">
                <v-col cols="12">
                  <v-card elevation="1" class="pa-3">
                    <v-card-title class="text-h6 pa-0 mb-3">
                      Itens Adicionados ({{ itensAcumulados.length }})
                    </v-card-title>
                    
                    <div class="itens-adicionados-container">
                      <v-chip
                        v-for="(item, index) in itensAcumulados"
                        :key="index"
                        color="success"
                        variant="outlined"
                        size="small"
                        class="ma-1"
                        closable
                        @click:close="removerItemAcumulado(index)"
                      >
                        {{ item.Lote }}
                        <template v-slot:append>
                          <v-icon size="small">mdi-weight-kilogram</v-icon>
                          {{ formatarPeso(item.ItOsPeso) }}
                        </template>
                      </v-chip>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>
          </v-col>

          <!-- Seção Lateral: Pesquisa de Itens -->
          <v-col cols="12" md="5">
            <v-card elevation="2" class="pa-4">
              <v-card-title class="text-h6 pa-0 mb-4">Pesquisa de Itens</v-card-title>
              
              <!-- Campos de Pesquisa -->
              <v-row class="mb-4">
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Pesquisar por Lote"
                    v-model="pesquisaLote"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    @input="pesquisarPorLote"
                    @clear="limparPesquisaLote"
                    placeholder="Digite o lote..."
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Pesquisar por Tag Bag"
                    v-model="pesquisaTagBag"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-magnify"
                    clearable
                    @input="pesquisarPorTagBag"
                    @clear="limparPesquisaTagBag"
                    placeholder="Digite a tag bag..."
                  />
                </v-col>
              </v-row>

              <!-- Tabela de Resultados da Pesquisa -->
              <v-card elevation="1" class="overflow-hidden">
                <v-data-table
                  :headers="headersPesquisa"
                  :items="resultadosPesquisa"
                  :loading="loadingPesquisa"
                  class="tabela-pesquisa"
                  :items-per-page="10"
                  height="400px"
                  fixed-header
                  hide-default-footer
                >
                  <!-- Estado de Carregamento -->
                  <template v-slot:loading>
                    <div class="loading-container">
                      <v-progress-circular
                        indeterminate
                        color="primary"
                        size="32"
                      ></v-progress-circular>
                      <p class="mt-2 text-grey">Pesquisando...</p>
                    </div>
                  </template>

                  <!-- Estado Sem Dados -->
                  <template v-slot:no-data>
                    <div class="no-data-container">
                      <v-icon size="48" color="grey-lighten-1" class="mb-2">
                        {{ (pesquisaLote || pesquisaTagBag) ? 'mdi-file-search-outline' : 'mdi-magnify' }}
                      </v-icon>
                      <p class="text-grey-darken-1">
                        {{ (pesquisaLote || pesquisaTagBag) ? 'Nenhum item encontrado' : 'Digite um lote ou tag bag para pesquisar' }}
                      </p>
                    </div>
                  </template>

                  <!-- Formatação das Linhas da Tabela -->
                  <template v-slot:item="{ item }">
                    <tr @click="selecionarItem(item)" class="cursor-pointer" :class="{ 'selected-row': isItemSelected(item) }">
                      <td>
                        <v-radio
                          :model-value="itemSelecionado?.uniqueId"
                          :value="item.uniqueId"
                          color="primary"
                          @click.stop="selecionarItem(item)"
                        />
                      </td>
                      <td>
                        <span class="text-blue-darken-2 font-weight-medium">
                          {{ item.lote }}
                        </span>
                      </td>
                      <td>
                        <span class="text-green-darken-2">
                          {{ item.tagBag ? item.tagBag.slice(-6) : '' }}
                        </span>
                      </td>
                      <td>
                        <span class="font-weight-bold">
                          {{ formatarPeso(item.peso) }}
                        </span>
                      </td>
                      <td>
                        <span class="text-orange-darken-2 font-weight-bold">
                          {{ formatarSacas(item.sacas) }}
                        </span>
                      </td>
                      <td>
                        <span class="text-purple-darken-2">
                          {{ item.endereco }}
                        </span>
                      </td>
                      <td>
                        <v-chip
                          :color="getStatusColor(item.status)"
                          size="small"
                          variant="flat"
                        >
                          {{ item.status }}
                        </v-chip>
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </v-card>
            </v-card>
          </v-col>
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

// Armazena a resposta da API para enviar quando usuário fechar
const ultimaResposta = ref(null);

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
         formData.value.empilhadeira &&
         itemSelecionado.value !== null;
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
  // Gera o próximo número de item automaticamente
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
  formData.value.blocoDestino = '';
  formData.value.posicaoDestino = '';
  formData.value.empilhadeira = '';
  formData.value.observacao = '';
  
  // Limpa pesquisa e seleções
  pesquisaLote.value = '';
  pesquisaTagBag.value = '';
  resultadosPesquisa.value = [];
  itemSelecionado.value = null;
  itensAcumulados.value = [];
  ultimaResposta.value = null; // Limpa resposta anterior
  
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
  
  // Tenta extrair bloco e posição do endereço atual
  if (item?.endereco && item.endereco.length >= 6) {
    const endereco = item.endereco;
    const bloco = endereco.substring(0, 3); // Primeiros 3 dígitos
    
    // Verifica se o bloco existe nas opções carregadas
    const blocoEncontrado = opcoesBlocoDestino.value.find(b => b.value === bloco);
    if (blocoEncontrado) {
      formData.value.blocoDestino = bloco;
      onBlocoDestinoChange(); // Atualiza as opções de posição
      
      // Define a posição como o endereço completo
      setTimeout(() => {
        const posicaoEncontrada = opcoesPosicaoDestino.value.find(p => p.value === endereco);
        if (posicaoEncontrada) {
          formData.value.posicaoDestino = endereco;
        }
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

// ===== FUNÇÕES DE INCLUSÃO DE ITENS =====

/**
 * Confirma a inclusão de um item na lista acumulada
 */
const confirmarInclusao = () => {
  if (!formValido.value || !itemSelecionado.value) {
    return;
  }

  loading.value = true;
  
  const itemAtual = formData.value.item;
  const agora = new Date();
  const dataFormatada = formatarDataAtual(agora);
  const horaFormatada = formatarHoraAtual(agora);

  const novoItem = {
    OSID: "",
    ItOSItem: "",
    OpTck: "",
    EmpiCod: formData.value.empilhadeira,
    MotCod: "", 
    ItOSData: dataFormatada,
    ItOSHora: horaFormatada,
    ItOsTagBag: itemSelecionado.value?.tagBag || "",
    ItOsOrigem: itemSelecionado.value?.endereco || "",
    ItOsTagOrigem: "",
    ItOsDestino: formData.value.posicaoDestino,
    ItOsTagDestino: formData.value.blocoDestino === 'MOEGA' ? formData.value.posicaoDestino : "",
    ItOSStatus: "AB",
    Lote: itemSelecionado.value?.lote || "",
    ItOsObs: formData.value.observacao || "",
    ItOsPeso: parseFloat(itemSelecionado.value?.peso) || 0
  };

  // Adiciona à lista acumulada
  itensAcumulados.value.push(novoItem);
  
  console.log('➕ Item adicionado à lista:', novoItem);
  console.log('📝 Lista acumulada atual:', itensAcumulados.value);
  console.log('🔢 Total de itens acumulados:', itensAcumulados.value.length);
  
  // Mostra notificação de item adicionado (com timeout de 3 segundos)
  mostrarNotificacao(
    'success',
    'Item adicionado com sucesso!',
    `Lote: ${itemSelecionado.value?.lote} - Total de itens: ${itensAcumulados.value.length}`,
    null,
    3000
  );
  
  // Simula processamento
  setTimeout(() => {
    limparCamposParaNovoItem();
    loading.value = false;
  }, 500);
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
  
  // Mantém os campos fixos (bloco destino, posição destino, empilhadeira)
  // para facilitar a inclusão de múltiplos itens para o mesmo destino
};

/**
 * Finaliza a inclusão enviando todos os itens acumulados
 */
const finalizarInclusao = async () => {
  if (itensAcumulados.value.length === 0) {
    return;
  }

  loading.value = true;

  try {
    // Gera dados no formato esperado pela API
    const agora = new Date();
    const dataFormatada = formatarDataAtual(agora);
    const horaFormatada = formatarHoraAtual(agora);

    const dadosAPI = {
      wms_os: {
        OSID: "",
        MotCod: "", 
        OSOpTck: props.dadosOrdemServico.osid || "",
        OSPrioridade: "0",
        OSBlocoSuger: "",
        OSData: dataFormatada,
        OSHora: horaFormatada
      },
      wms_itemos: itensAcumulados.value
    };
    
    // Console.log para verificar os dados sendo enviados
    console.log('📋 Dados sendo enviados para setWMSOS:');
    console.log('🔹 wms_os:', dadosAPI.wms_os);
    console.log('🔹 wms_itemos:', dadosAPI.wms_itemos);
    console.log('🔹 Total de itens:', dadosAPI.wms_itemos.length);
    console.log('🔹 Payload completo:', dadosAPI);
    
    // Envia os dados para a API
    const response = await wmSOSStore.WMSOS(dadosAPI);
    
    console.log('✅ Resposta da API setWMSOS:', response);
    
    // Verifica se a resposta foi bem sucedida
    if (response && response.code === 600 && response.type === 'OK') {
      // Armazena a resposta para enviar quando usuário fechar
      ultimaResposta.value = response;
      
      // Exibe mensagem de sucesso para o usuário (sem timeout - usuário deve fechar)
      mostrarNotificacao(
        'success', 
        response.message, 
        `Itens processados: ${itensAcumulados.value.length}`,
        response.data,
        -1
      );
      
      // NÃO emite evento nem fecha modal automaticamente - deixa o usuário decidir
    } else {
      // Se a resposta não foi bem sucedida (sem timeout - usuário deve fechar)
      ultimaResposta.value = response;
      
      mostrarNotificacao(
        'error',
        'Erro ao processar dados',
        response?.message || 'Erro desconhecido',
        null,
        -1
      );
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar dados para setWMSOS:', error);
    
    // Exibe mensagem de erro para o usuário (sem timeout - usuário deve fechar)
    mostrarNotificacao(
      'error',
      'Erro ao enviar dados',
      error?.message || 'Erro de comunicação com o servidor',
      null,
      -1
    );
  } finally {
    loading.value = false;
  }
};

/**
 * Remove um item da lista acumulada
 */
const removerItemAcumulado = (index) => {
  itensAcumulados.value.splice(index, 1);
};

/**
 * Fecha o modal
 */
const fecharModal = () => {
  dialogVisible.value = false;
  showSnackbar.value = false; // Também fecha qualquer notificação ativa
  ultimaResposta.value = null; // Limpa resposta armazenada
};

/**
 * Fecha o modal após sucesso, mantendo a notificação visível por um momento
 */
const fecharModalAposSucesso = () => {
  showSnackbar.value = false;
  
  // Emite o evento para o componente pai com a resposta armazenada
  if (ultimaResposta.value) {
    emit('confirmar', ultimaResposta.value);
  }
  
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
