<template>
  <!-- Seção Principal da Tabela de Produção/Parada -->
  <div v-if="mostrarTabela" class="table-section">
    
    <!-- Tabela Principal de Dados -->
    <v-card class="table-card" elevation="3">
      <v-data-table
        :headers="headersAtivos"
        :items="dadosProcessados"
        :loading="loading"
        class="data-table-custom"
        :items-per-page="-1"
        :search="buscaLocal"
        fixed-header
        height="350px"
        hide-default-footer
        :show-expand="tipoVisualizacao === 'sintetico'"
        v-model:expanded="expandedRows"
        item-value="id"
      >
        
        <!-- Toolbar superior da tabela -->
        <template v-slot:top>
          <div class="table-toolbar pa-3">
            <div class="d-flex justify-space-between align-center">
              <div class="d-flex align-center ga-3">
                <h3 class="table-title">Produção e parada</h3>
                <v-select
                  v-model="tipoVisualizacao"
                  :items="[
                    { title: 'Analítico', value: 'analitico' },
                    { title: 'Sintético', value: 'sintetico' }
                  ]"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="width: 150px;"
                  class="tipo-select"
                />
              </div>
              <div class="d-flex ga-2 align-center">
                <v-text-field
                  v-model="buscaLocal"
                  label="Buscar na tabela..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                  style="width: 300px;"
                  class="search-field"
                  @input="$emit('update:busca', buscaLocal)"
                />
                <!-- Botão para configurar colunas -->
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-view-column"
                  @click="abrirModalColunas"
                >
                  Configurar Colunas
                </v-btn>
                <!-- Botão para exportar dados -->
                <v-btn
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-download"
                  @click="exportarDados"
                  :disabled="dados.length === 0"
                >
                  Exportar Excel
                </v-btn>
              </div>
            </div>
          </div>
        </template>

        <!-- Estado quando não há dados -->
        <template v-slot:no-data>
          <div class="no-data-container">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
            <h3 class="text-grey-darken-1 mb-2">Nenhum dado encontrado</h3>
            <p class="text-grey">Configure os filtros e clique em "Filtrar" para carregar os dados.</p>
          </div>
        </template>
        
        <!-- Estado de carregamento -->
        <template v-slot:loading>
          <div class="loading-container">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <p class="mt-4 text-grey">Carregando dados...</p>
          </div>
        </template>

        <!-- Template customizado para as células da tabela -->
        <template v-slot:item="{ item }">
          <tr class="table-row-hover">
            <td v-for="header in headersAtivos" :key="header.key" class="table-cell text-left">
              <span 
                :class="getCellClass(header.key)"
              >
                {{ formatCellValue(obterValorDoItem(item, header.key), header.key) }}
              </span>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </div>

  <!-- Modal de Configuração de Colunas -->
  <v-dialog v-model="modalColunas" max-width="600" persistent>
    <v-card class="column-config-modal">
      
      <!-- Header do Modal -->
      <v-card-title class="modal-header pa-4">
        <div class="d-flex align-center w-100">
          <div class="d-flex align-center">
            <v-icon color="white" size="24" class="mr-2">mdi-view-column</v-icon>
            <h2 class="modal-title">Configurar Colunas</h2>
          </div>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            class="close-btn"
            @click="fecharModalColunas"
          />
        </div>
      </v-card-title>
      
      <!-- Conteúdo do Modal -->
      <v-card-text class="pa-0">
        <div class="config-content pa-4">
          <div class="config-section">
            
            <!-- Header da seção com estatísticas e ações -->
            <div class="section-header mb-4">
              <!-- Estatísticas das colunas -->
              <div class="section-stats">
                <v-chip color="success" size="small" class="mr-2">
                  <v-icon size="14" class="mr-1">mdi-eye</v-icon>
                  {{ colunasVisiveis.length }} Ativas
                </v-chip>
                <v-chip color="warning" size="small" class="mr-2">
                  <v-icon size="14" class="mr-1">mdi-eye-off</v-icon>
                  {{ configColunas.length - colunasVisiveis.length }} Inativas
                </v-chip>
              </div>
              
              <!-- Ações rápidas -->
              <div class="section-actions">
                <v-btn
                  size="small"
                  variant="outlined"
                  color="primary"
                  @click="selecionarTodas"
                  class="mr-2"
                >
                  <v-icon size="16" class="mr-1">mdi-check-all</v-icon>
                  Todas
                </v-btn>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="error"
                  @click="deselecionarTodas"
                >
                  <v-icon size="16" class="mr-1">mdi-close-box-multiple</v-icon>
                  Nenhuma
                </v-btn>
              </div>
            </div>

            <!-- Lista Ordenável de Colunas com Drag & Drop -->
            <div class="columns-list">
              <transition-group 
                name="column-item" 
                tag="div" 
                class="sortable-list"
              >
                <div
                  v-for="(coluna, index) in configColunas"
                  :key="coluna.key"
                  :class="getColumnItemClass(coluna)"
                  :draggable="true"
                  @dragstart="iniciarArraste(index)"
                  @dragover.prevent
                  @dragenter.prevent
                  @drop="soltarItem(index)"
                  @dragend="finalizarArraste"
                >
                  <div class="column-item-content">
                    <!-- Handle para arrastar -->
                    <div class="drag-handle">
                      <v-icon size="20" color="grey-darken-1">mdi-drag-vertical</v-icon>
                    </div>

                    <!-- Checkbox da coluna -->
                    <v-checkbox
                      v-model="coluna.visivel"
                      color="primary"
                      density="compact"
                      hide-details
                      class="column-checkbox"
                      @change="atualizarPrevisualizacao"
                    />

                    <!-- Informações da Coluna -->
                    <div class="column-info">
                      <div class="column-title">{{ coluna.title }}</div>
                      <div class="column-key">{{ coluna.key }}</div>
                    </div>

                    <!-- Status da coluna -->
                    <div class="column-status">
                      <v-chip
                        :color="coluna.visivel ? 'success' : 'grey'"
                        :variant="coluna.visivel ? 'tonal' : 'outlined'"
                        size="small"
                        class="status-chip"
                      >
                        <v-icon 
                          :icon="coluna.visivel ? 'mdi-eye' : 'mdi-eye-off'"
                          size="14"
                          class="mr-1"
                        />
                        {{ coluna.visivel ? 'Visível' : 'Oculta' }}
                      </v-chip>
                    </div>

                    <!-- Indicador de ordem -->
                    <div class="order-indicator">
                      <v-chip
                        color="primary"
                        variant="elevated"
                        size="small"
                        v-if="coluna.visivel"
                      >
                        {{ obterOrdemColuna(index) }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </transition-group>
            </div>
          </div>
        </div>
      </v-card-text>
      
      <!-- Botões de ação do modal -->
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="primary"
          variant="elevated"
          @click="aplicarConfiguracaoColunas"
          :loading="salvandoColunas"
          :disabled="colunasVisiveis.length === 0"
          size="large"
        >
          <v-icon size="18" class="mr-2">mdi-check</v-icon>
          Aplicar Configuração
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { setColumn } from '@/stores/Consultas/setCollumn';
import { maquinario } from '@/stores/Consultas/getMaquinario';

// ===== PROPS E EMITS =====
const props = defineProps({
  dados: {
    type: Array,
    default: () => []
  },
  headers: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  mostrarTabela: {
    type: Boolean,
    default: false
  },
  busca: {
    type: String,
    default: ''
  },
  labelMapCompleto: {
    type: Array,
    default: () => []
  },
  alturaTabela: {
    type: Number,
    default: 600
  }
});

const emit = defineEmits(['atualizar', 'update:busca']);

// ===== ESTADOS REATIVOS =====
// Estados básicos
const buscaLocal = ref(props.busca);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const tipoVisualizacao = ref('analitico'); // 'analitico' ou 'sintetico'

// Estados do modal de configuração
const modalColunas = ref(false);
const salvandoColunas = ref(false);
const configColunas = ref([]);
const itemArrastando = ref(null);

// Store da API
const setColumnStore = setColumn();
const maquinarioStore = maquinario();

// Dados de maquinários
const maquinarios = ref([]);

// ===== CONFIGURAÇÕES CONSTANTES =====
// Opções de paginação
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 15, title: '15' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: -1, title: 'Todos' }
];

// Campos possíveis da API prodParada
const todosOsCamposPossiveis = [
  { key: 'parID', title: 'ID' },
  { key: 'maqCod', title: 'Maquinário' },
  { key: 'parDataIni', title: 'Data Inicial' },
  { key: 'parHoraIni', title: 'Hora Inicial' },
  { key: 'parDataFim', title: 'Data Final' },
  { key: 'parHoraFim', title: 'Hora Final' },
  { key: 'parTipo', title: 'Tipo' },
  { key: 'parOP', title: 'OP' },
  { key: 'userCod', title: 'Usuário' },
  { key: 'parMotivo', title: 'Motivo' },
  { key: 'parQtdVez', title: 'Qtd Vez' },
  { key: 'parPeneira', title: 'Peneira' }
];

// ===== WATCHERS =====
// Sincroniza busca com prop externa
watch(() => props.busca, (newVal) => {
  buscaLocal.value = newVal;
  currentPage.value = 1;
});

// Reset página quando dados mudam
watch(() => props.dados, () => {
  currentPage.value = 1;
});

// Atualiza configuração quando headers mudam
watch(() => props.headers, (newHeaders) => {
  if (newHeaders && newHeaders.length > 0) {
    atualizarConfigColunas(newHeaders, props.labelMapCompleto);
  }
}, { immediate: true });

// Atualiza quando labelMapCompleto muda
watch(() => props.labelMapCompleto, (newLabelMap) => {
  if (newLabelMap && newLabelMap.length > 0) {
    atualizarConfigColunas(props.headers, newLabelMap);
  }
}, { immediate: true });

// ===== COMPUTED PROPERTIES =====
// Headers sintéticos
const headersSinteticos = computed(() => [
  { title: 'OP', key: 'parOP', align: 'start', sortable: true },
  { title: 'Maquinário', key: 'maquinarios', align: 'start', sortable: true },
  { title: 'Operadores', key: 'operadores', align: 'start', sortable: true },
  { title: 'Tempo Produção', key: 'tempoProducao', align: 'start', sortable: true },
  { title: 'Tempo Parada', key: 'tempoParada', align: 'start', sortable: true },
  { title: 'Tempo Total', key: 'totalHoras', align: 'start', sortable: true },
  { title: 'Registros', key: 'quantidadeRegistros', align: 'start', sortable: true }
]);

// Headers para detalhes do modo sintético (quando expandir)
const headersDetalheSintetico = computed(() => [
  { title: 'Tipo', key: 'parTipo', align: 'start', sortable: false },
  { title: 'Total de Horas', key: 'totalHoras', align: 'start', sortable: false },
  { title: 'Registros', key: 'quantidadeRegistros', align: 'start', sortable: false }
]);

// Headers ativos baseados no tipo de visualização
const headersAtivos = computed(() => {
  return tipoVisualizacao.value === 'sintetico' ? headersSinteticos.value : props.headers;
});

// Dados sintéticos agrupados
const dadosSinteticos = computed(() => {
  if (tipoVisualizacao.value !== 'sintetico') return [];
  
  // Agrupa por OP
  const agrupamentoPorOP = {};
  
  props.dados.forEach(item => {
    const op = obterValorDoItem(item, 'parOP') || 'SEM OP';
    const tipo = obterValorDoItem(item, 'parTipo') || 'N/A';
    const maqCod = obterValorDoItem(item, 'maqCod') || '';
    const userCod = obterValorDoItem(item, 'userCod') || '';
    
    // Cria entrada da OP se não existir
    if (!agrupamentoPorOP[op]) {
      agrupamentoPorOP[op] = {
        parOP: op,
        totalHoras: 0,
        tempoProducao: 0,
        tempoParada: 0,
        quantidadeRegistros: 0,
        maquinarios: new Set(),
        operadores: new Set(),
        _detalhes: {} // Agrupamento por tipo dentro da OP
      };
    }
    
    // Adiciona maquinário e operador aos conjuntos
    if (maqCod) agrupamentoPorOP[op].maquinarios.add(maqCod);
    if (userCod) agrupamentoPorOP[op].operadores.add(userCod);
    
    // Cria entrada do tipo dentro da OP se não existir
    if (!agrupamentoPorOP[op]._detalhes[tipo]) {
      agrupamentoPorOP[op]._detalhes[tipo] = {
        parTipo: tipo,
        totalHoras: 0,
        quantidadeRegistros: 0
      };
    }
    
    // Calcula duração em horas
    const dataIni = obterValorDoItem(item, 'parDataIni');
    const horaIni = obterValorDoItem(item, 'parHoraIni');
    const dataFim = obterValorDoItem(item, 'parDataFim');
    const horaFim = obterValorDoItem(item, 'parHoraFim');
    
    const horas = calcularDiferencaHoras(dataIni, horaIni, dataFim, horaFim);
    
    // Soma no total da OP
    agrupamentoPorOP[op].totalHoras += horas;
    agrupamentoPorOP[op].quantidadeRegistros += 1;
    
    // Separa por tipo de tempo
    if (tipo === 'PRO') {
      agrupamentoPorOP[op].tempoProducao += horas;
    } else if (tipo === 'PAR' || tipo === 'PRF') {
      agrupamentoPorOP[op].tempoParada += horas;
    }
    
    // Soma no total do tipo
    agrupamentoPorOP[op]._detalhes[tipo].totalHoras += horas;
    agrupamentoPorOP[op]._detalhes[tipo].quantidadeRegistros += 1;
  });
  
  // Converte objeto em array e formata horas
  return Object.values(agrupamentoPorOP).map((op, index) => ({
    id: `op-${index}-${op.parOP}`, // ID único para expansão
    parOP: op.parOP,
    maquinarios: Array.from(op.maquinarios).map(cod => formatMaquinarioValue(cod)).join(', '),
    operadores: Array.from(op.operadores).join(', '),
    tempoProducao: formatarHoras(op.tempoProducao),
    tempoParada: formatarHoras(op.tempoParada),
    totalHoras: formatarHoras(op.totalHoras),
    quantidadeRegistros: op.quantidadeRegistros,
    _detalhes: Object.values(op._detalhes).map(tipo => ({
      parTipo: tipo.parTipo,
      totalHoras: formatarHoras(tipo.totalHoras),
      quantidadeRegistros: tipo.quantidadeRegistros
    }))
  }));
});

// Dados processados baseados no tipo de visualização
const dadosProcessados = computed(() => {
  const dados = tipoVisualizacao.value === 'sintetico' ? dadosSinteticos.value : filteredItems.value;
  
  // Aplica busca se houver
  if (!buscaLocal.value) return dados;
  
  const termoBusca = buscaLocal.value.toLowerCase();
  return dados.filter(item => {
    // Para dados sintéticos, busca apenas nos campos visíveis (exclui _detalhes e id)
    const camposPesquisaveis = Object.entries(item).filter(([key]) => !key.startsWith('_') && key !== 'id');
    
    return camposPesquisaveis.some(([key, valor]) => {
      // Verifica se o valor não é um objeto ou array
      if (typeof valor !== 'object' && valor !== null) {
        return String(valor).toLowerCase().includes(termoBusca);
      }
      return false;
    });
  });
});

// Filtro de dados baseado na busca com ordenação cronológica
const filteredItems = computed(() => {
  // Primeiro aplica o filtro de busca
  let dadosFiltrados = props.dados;
  
  if (buscaLocal.value) {
    const termoBusca = buscaLocal.value.toLowerCase();
    dadosFiltrados = props.dados.filter(item => {
      return Object.values(item).some(valor => 
        String(valor).toLowerCase().includes(termoBusca)
      );
    });
  }
  
  // Depois ordena por data e hora cronologicamente
  return [...dadosFiltrados].sort((a, b) => {
    // Obtém data inicial de cada item (tentando diferentes variações de chave)
    const dataA = obterValorDoItem(a, 'parDataIni') || obterValorDoItem(a, 'ParDataIni') || '';
    const dataB = obterValorDoItem(b, 'parDataIni') || obterValorDoItem(b, 'ParDataIni') || '';
    
    // Compara as datas (formato YYYYMMDD permite comparação direta como string)
    if (dataA !== dataB) {
      return dataA.localeCompare(dataB);
    }
    
    // Se as datas são iguais, ordena por hora
    const horaA = obterValorDoItem(a, 'parHoraIni') || obterValorDoItem(a, 'ParHoraIni') || '00:00';
    const horaB = obterValorDoItem(b, 'parHoraIni') || obterValorDoItem(b, 'ParHoraIni') || '00:00';
    
    return horaA.localeCompare(horaB);
  });
});

// Colunas visíveis na ordem configurada
const colunasVisiveis = computed(() => {
  return configColunas.value.filter(coluna => coluna.visivel);
});

// Mapa de códigos de maquinário para nomes
const maquinarioMap = computed(() => {
  const map = {};
  maquinarios.value.forEach(item => {
    map[item.id] = item.nome;
  });
  return map;
});

// ===== FUNÇÕES AUXILIARES DE FORMATAÇÃO =====
/**
 * Calcula diferença em horas entre duas datas/horas
 */
const calcularDiferencaHoras = (dataIni, horaIni, dataFim, horaFim) => {
  try {
    // Se não tiver todos os dados, retorna 0
    if (!dataIni || !horaIni || !dataFim || !horaFim) return 0;
    
    // Converte data de YYYYMMDD para Date
    const parseData = (dataStr, horaStr) => {
      if (!dataStr || dataStr.length !== 8) return null;
      
      const ano = dataStr.substring(0, 4);
      const mes = dataStr.substring(4, 6);
      const dia = dataStr.substring(6, 8);
      
      // Converte hora HH:MM para horas e minutos
      const [horas, minutos] = horaStr.split(':');
      
      return new Date(ano, parseInt(mes) - 1, dia, parseInt(horas), parseInt(minutos));
    };
    
    const dateIni = parseData(dataIni, horaIni);
    const dateFim = parseData(dataFim, horaFim);
    
    if (!dateIni || !dateFim) return 0;
    
    // Calcula diferença em milissegundos
    const diferencaMs = dateFim - dateIni;
    
    // Converte para horas (com decimais)
    const horas = diferencaMs / (1000 * 60 * 60);
    
    return horas > 0 ? horas : 0;
  } catch (error) {
    console.error('Erro ao calcular diferença de horas:', error);
    return 0;
  }
};

/**
 * Formata horas decimais para HH:MM
 */
const formatarHoras = (horasDecimais) => {
  if (!horasDecimais || horasDecimais === 0) return '0h 00min';
  
  const horas = Math.floor(horasDecimais);
  const minutos = Math.round((horasDecimais - horas) * 60);
  
  return `${horas}h ${minutos.toString().padStart(2, '0')}min`;
};

/**
 * Retorna cor baseada no tipo (PRO/PAR/PRF)
 */
const getTipoColor = (tipo) => {
  switch(tipo) {
    case 'PRO':
      return 'success'; // Verde para produção
    case 'PAR':
      return 'warning'; // Amarelo para parada
    case 'PRF':
      return 'error'; // Vermelho para parada final
    default:
      return 'grey';
  }
};

/**
 * Normaliza chaves (converte primeira letra para minúscula)
 */
const normalizarChave = (key) => {
  if (!key || typeof key !== 'string') return key;
  return key.charAt(0).toLowerCase() + key.slice(1);
};

/**
 * Verifica se o campo é numérico
 */
const isNumericField = (fieldKey) => {
  const numericFields = ['parQtdVez', 'peso', 'quant', 'quantidade', 'valor', 'val', 'num', 'qtd', 'tx'];
  return numericFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

/**
 * Verifica se o campo é um ID
 */
const isIdField = (fieldKey) => {
  const idFields = ['parID', 'id'];
  return idFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

/**
 * Verifica se o campo é uma data
 */
const isDateField = (fieldKey) => {
  const dateFields = ['parDataIni', 'parDataFim', 'data', 'date'];
  return dateFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

/**
 * Verifica se o campo é uma hora
 */
const isTimeField = (fieldKey) => {
  const timeFields = ['parHoraIni', 'parHoraFim', 'hora', 'time'];
  return timeFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

/**
 * Verifica se o campo é código de maquinário
 */
const isMaquinarioField = (fieldKey) => {
  const maqFields = ['maqCod', 'maquinario', 'maquina'];
  return maqFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

/**
 * Retorna classe CSS baseada no tipo de campo
 */
const getCellClass = (fieldKey) => {
  if (fieldKey === 'totalHoras') return 'numeric-value';
  if (fieldKey === 'tempoProducao') return 'numeric-value';
  if (fieldKey === 'tempoParada') return 'numeric-value';
  if (fieldKey === 'quantidadeRegistros') return 'numeric-value';
  if (fieldKey === 'maquinarios') return 'text-value';
  if (fieldKey === 'operadores') return 'text-value';
  if (isIdField(fieldKey)) return 'id-value';
  if (isNumericField(fieldKey)) return 'numeric-value';
  if (isDateField(fieldKey)) return 'date-value';
  if (isTimeField(fieldKey)) return 'time-value';
  if (isMaquinarioField(fieldKey)) return 'maquinario-value';
  return 'text-value';
};

/**
 * Formata código do maquinário para nome
 */
const formatMaquinarioValue = (value) => {
  if (!value) return '-';
  return maquinarioMap.value[value] || value;
};

/**
 * Retorna classe CSS para item da coluna no modal
 */
const getColumnItemClass = (coluna) => {
  return [
    'column-item',
    { 'column-visible': coluna.visivel, 'column-hidden': !coluna.visivel }
  ];
};

/**
 * Obtém valor do item tentando diferentes variações da chave
 */
const obterValorDoItem = (item, headerKey) => {
  // Tenta primeiro a chave exata do header
  if (item[headerKey] !== undefined) {
    return item[headerKey];
  }
  
  // Tenta a chave com primeira letra maiúscula
  const chaveCapitalizada = headerKey.charAt(0).toUpperCase() + headerKey.slice(1);
  if (item[chaveCapitalizada] !== undefined) {
    return item[chaveCapitalizada];
  }
  
  // Tenta a chave com primeira letra minúscula
  const chaveMinuscula = headerKey.charAt(0).toLowerCase() + headerKey.slice(1);
  if (item[chaveMinuscula] !== undefined) {
    return item[chaveMinuscula];
  }
  
  // Busca case-insensitive
  const todasAsChaves = Object.keys(item);
  const chaveEncontrada = todasAsChaves.find(k => k.toLowerCase() === headerKey.toLowerCase());
  if (chaveEncontrada) {
    return item[chaveEncontrada];
  }
  
  return undefined;
};

/**
 * Formata valor numérico
 */
const formatNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Formata valor de data
 */
const formatDateValue = (value) => {
  if (!value) return '-';
  // Se for uma data no formato YYYYMMDD, converte para DD/MM/YYYY
  if (typeof value === 'string' && value.length === 8 && /^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return value;
};

/**
 * Formata valor da célula baseado no tipo do campo
 */
const formatCellValue = (value, fieldKey) => {
  if (fieldKey === 'totalHoras' || fieldKey === 'tempoProducao' || fieldKey === 'tempoParada') {
    // Já vem formatado do computed
    return value || '0h 00min';
  } else if (fieldKey === 'quantidadeRegistros') {
    return value || '0';
  } else if (fieldKey === 'maquinarios' || fieldKey === 'operadores') {
    return value || '-';
  } else if (isIdField(fieldKey)) {
    // IDs são números inteiros, sem casas decimais
    if (value === null || value === undefined || value === '') return '-';
    const num = parseInt(value);
    if (isNaN(num)) return value;
    return num.toString();
  } else if (isNumericField(fieldKey)) {
    return formatNumericValue(value);
  } else if (isDateField(fieldKey)) {
    return formatDateValue(value);
  } else if (isTimeField(fieldKey)) {
    return value || '-'; // Horários já vêm formatados como HH:MM
  } else if (isMaquinarioField(fieldKey)) {
    return formatMaquinarioValue(value);
  }
  return value || '-';
};

// ===== FUNÇÕES DE PAGINAÇÃO =====
/**
 * Manipula mudança de página
 */
const onPageChange = (page) => {
  currentPage.value = page;
};

/**
 * Manipula mudança de itens por página
 */
const onItemsPerPageChange = (itemsPerPageValue) => {
  itemsPerPage.value = itemsPerPageValue;
  currentPage.value = 1; // Reset para primeira página
};

// ===== FUNÇÕES DE CONFIGURAÇÃO DE COLUNAS =====
/**
 * Atualiza configuração das colunas baseado nos headers e labelMap
 */
const atualizarConfigColunas = (headers, labelMapCompleto = null) => {
  // Se temos labelMap completo da resposta, usa ele para saber todos os campos
  if (labelMapCompleto && Array.isArray(labelMapCompleto)) {
    configColunas.value = labelMapCompleto.map((item, index) => ({
      key: normalizarChave(item.key), // Normaliza a chave para minúscula
      title: item.label || item.title,
      visivel: item.exibe === 'S', // Marca como visível se exibe='S'
      ordem: index + 1
    }));
  } 
  // Se não temos labelMap completo, mas temos headers ativos, complementa com os possíveis
  else if (headers && headers.length > 0) {
    // Primeiro, adiciona os headers que estão ativos
    const camposAtivos = headers.map((header, index) => ({
      key: header.key,
      title: header.title,
      visivel: true, // Se está no header, está ativo
      ordem: index + 1
    }));
    
    // Depois, adiciona os campos possíveis que não estão nos headers (como inativos)
    todosOsCamposPossiveis.forEach(campo => {
      if (!camposAtivos.find(ativo => ativo.key === campo.key)) {
        camposAtivos.push({
          key: campo.key,
          title: campo.title,
          visivel: false, // Se não está no header, está inativo
          ordem: camposAtivos.length + 1
        });
      }
    });
    
    configColunas.value = camposAtivos;
  }
  // Fallback: usa apenas a lista de campos possíveis
  else {
    configColunas.value = todosOsCamposPossiveis.map((campo, index) => ({
      key: campo.key,
      title: campo.title,
      visivel: false, // Por padrão, todos inativos
      ordem: index + 1
    }));
  }
  
  // Atualiza a pré-visualização
  atualizarPrevisualizacao();
};

/**
 * Obtém ordem da coluna na lista de visíveis
 */
const obterOrdemColuna = (index) => {
  const colunasViseisAteIndex = configColunas.value
    .slice(0, index + 1)
    .filter(coluna => coluna.visivel);
  return colunasViseisAteIndex.length;
};

// ===== FUNÇÕES DO MODAL =====
/**
 * Abre modal de configuração de colunas
 */
const abrirModalColunas = () => {
  modalColunas.value = true;
};

/**
 * Fecha modal de configuração de colunas
 */
const fecharModalColunas = () => {
  modalColunas.value = false;
};

/**
 * Atualiza pré-visualização das colunas
 */
const atualizarPrevisualizacao = () => {
  // Função para atualizar a pré-visualização (pode ser expandida se necessário)
};

// ===== FUNÇÕES DE DRAG & DROP =====
/**
 * Inicia arraste de item
 */
const iniciarArraste = (index) => {
  itemArrastando.value = index;
};

/**
 * Finaliza arraste de item
 */
const finalizarArraste = () => {
  itemArrastando.value = null;
};

/**
 * Solta item em nova posição
 */
const soltarItem = (indexDestino) => {
  if (itemArrastando.value === null || itemArrastando.value === indexDestino) return;
  
  const itemMovido = configColunas.value.splice(itemArrastando.value, 1)[0];
  configColunas.value.splice(indexDestino, 0, itemMovido);
  
  atualizarPrevisualizacao();
};

// ===== FUNÇÕES DE CONTROLE DE COLUNAS =====
/**
 * Seleciona todas as colunas
 */
const selecionarTodas = () => {
  configColunas.value.forEach(coluna => {
    coluna.visivel = true;
  });
  atualizarPrevisualizacao();
};

/**
 * Deseleciona todas as colunas
 */
const deselecionarTodas = () => {
  configColunas.value.forEach(coluna => {
    coluna.visivel = false;
  });
  atualizarPrevisualizacao();
};

/**
 * Aplica configuração de colunas - salva na API
 */
const aplicarConfiguracaoColunas = async () => {
  salvandoColunas.value = true;
  
  try {
    // Monta o payload com as colunas na ordem configurada pelo usuário
    const colunasOrdenadas = configColunas.value.map(coluna => ({
      key: coluna.key,
      value: coluna.visivel ? 'S' : 'N'
    }));
    
    const payload = colunasOrdenadas
      .map(item => `${item.key}=${item.value}`)
      .join(',');
    
    // Parâmetros da query
    const queryParams = {
      grid: 'PRODPAR', // Grid específico para produção/parada
      user: localStorage.getItem('user')
    };
    
    // Envio para a API
    const response = await setColumnStore.setColumn(payload, queryParams);
    
    // Fecha o modal
    modalColunas.value = false;
    
    // Emite evento para o componente pai atualizar os dados
    emit('atualizar');
    
    // Feedback de sucesso
    alert(`✅ Configuração salva com sucesso!\n\n📊 ${colunasVisiveis.value.length} colunas ativas de ${configColunas.value.length} disponíveis\n\n🔄 Atualize os dados para ver as mudanças.`);
    
  } catch (error) {
    alert(`❌ Erro ao salvar configuração: ${error.message}`);
  } finally {
    salvandoColunas.value = false;
  }
};

// ===== FUNÇÃO DE EXPORTAÇÃO =====
/**
 * Exporta dados para Excel
 */
const exportarDados = () => {
  if (props.dados.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  try {
    // Cria uma planilha Excel usando HTML table
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #37474f; color: white; font-weight: bold; padding: 8px; border: 1px solid #ccc; text-align: left; }
          td { padding: 8px; border: 1px solid #ccc; text-align: left; }
          .numeric { text-align: left; }
          .date { text-align: left; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
    `;

    // Adiciona cabeçalhos
    props.headers.forEach(header => {
      excelContent += `<th>${header.title}</th>`;
    });

    excelContent += `
            </tr>
          </thead>
          <tbody>
    `;

    // Adiciona dados
    props.dados.forEach(item => {
      excelContent += '<tr>';
      props.headers.forEach(header => {
        // Usa obterValorDoItem para garantir que pega o valor correto
        let value = obterValorDoItem(item, header.key);
        let cellClass = '';
        
        // Aplica formatação baseada no tipo de campo
        if (isNumericField(header.key)) {
          cellClass = 'numeric';
          value = formatNumericValue(value);
        } else if (isDateField(header.key)) {
          cellClass = 'date';
          value = formatDateValue(value);
        }
        
        // Garante que value é uma string antes de aplicar replace
        value = value !== null && value !== undefined ? String(value) : '';
        
        // Escapa caracteres especiais para HTML
        value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        excelContent += `<td class="${cellClass}">${value}</td>`;
      });
      excelContent += '</tr>';
    });

    excelContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Cria e baixa o arquivo Excel
    const blob = new Blob([excelContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Nome do arquivo com data e hora
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, 'h');
    
    link.setAttribute('download', `Guia_Entrada_${dataFormatada}_${horaFormatada}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libera a URL do blob
    URL.revokeObjectURL(url);
    
  } catch (error) {
    alert('Erro ao exportar dados para Excel');
  }
};

// ===== LIFECYCLE HOOKS =====
/**
 * Carrega maquinários ao montar o componente
 */
const carregarMaquinarios = async () => {
  try {
    const response = await maquinarioStore.maquinario();
    if (Array.isArray(response)) {
      maquinarios.value = response.map((nome, index) => ({
        nome: nome.trim(),
        id: String(index + 1).padStart(3, '0')
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar maquinários:', error);
  }
};

onMounted(() => {
  carregarMaquinarios();
});
</script>

<style scoped>
/* ===== LAYOUT PRINCIPAL ===== */
.table-section {
  margin-top: 1rem;
}

/* ===== HEADER DA TABELA ===== */
.table-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 1px solid #e0e0e0;
}

/* Campo de busca */
.search-field :deep(.v-field__outline) {
  border-color: #1976d2;
}

.search-field :deep(.v-field--focused .v-field__outline) {
  border-color: #1976d2;
  border-width: 2px;
}

/* Select de tipo de visualização */
.tipo-select :deep(.v-field__outline) {
  border-color: white;
}

.tipo-select :deep(.v-field) {
  background-color: rgba(255, 255, 255, 0.1);
}

.tipo-select :deep(.v-field__input),
.tipo-select :deep(.v-select__selection) {
  color: white !important;
}

.tipo-select :deep(.v-field__append-inner .v-icon) {
  color: white !important;
}

/* ===== TABELA PRINCIPAL ===== */
.table-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
}

.data-table-custom {
  background-color: #fafafa;
}

.data-table-custom :deep(.v-data-table__wrapper) {
  border-radius: 0;
}

/* Headers da tabela */
.data-table-custom :deep(.v-data-table-header th) {
  background-color: #37474f !important;
  color: white !important;
  font-weight: 600;
  border-bottom: 2px solid #263238;
  padding: 16px 12px;
  text-align: left !important;
}

.data-table-custom :deep(.v-data-table-header th .v-data-table-header__content) {
  color: white;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  justify-content: flex-start !important;
}

/* Toolbar da tabela */
.table-toolbar {
  background: linear-gradient(90deg, #37474f 0%, #455a64 100%);
  color: white;
  border-bottom: 1px solid #263238;
}

.table-title {
  color: white;
  font-weight: 500;
  margin: 0;
}

/* ===== LINHAS E CÉLULAS DA TABELA ===== */
.table-row-hover:hover {
  background-color: #e3f2fd !important;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.table-row-hover:nth-child(even) {
  background-color: #f8f9fa;
}

.table-row-hover:nth-child(odd) {
  background-color: #ffffff;
}

.table-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
  text-align: left !important;
}

/* ===== TIPOS DE VALORES NAS CÉLULAS ===== */
.numeric-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1976d2;
  text-align: left !important;
  display: block;
}

.id-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #9c27b0;
  text-align: left !important;
  display: block;
}

.date-value {
  font-weight: 500;
  color: #388e3c;
  text-align: left !important;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #ff9800;
  text-align: left !important;
}

.maquinario-value {
  font-weight: 500;
  color: #673ab7;
  text-align: left !important;
}

.text-value {
  color: #424242;
  text-align: left !important;
}

/* ===== ESTADOS ESPECIAIS DA TABELA ===== */
.no-data-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

/* ===== MODAL DE CONFIGURAÇÃO DE COLUNAS ===== */
.column-config-modal {
  border-radius: 16px;
  overflow: hidden;
  max-height: 90vh;
}

/* Header do Modal */
.modal-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  position: relative;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M0 0h40v40H0V0zm10 10h20v20H10V10z'/%3E%3C/g%3E%3C/svg%3E");
}

.modal-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  position: relative;
  z-index: 1;
}

.close-btn {
  color: white !important;
  position: relative;
  z-index: 1;
}

/* Conteúdo do Modal */
.config-content {
  background-color: #fafafa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 12px;
}

.section-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-actions {
  display: flex;
  gap: 0.5rem;
}

/* ===== LISTA DE COLUNAS ORDENÁVEL ===== */
.sortable-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-item {
  background: white;
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: move;
  user-select: none;
  position: relative;
  overflow: hidden;
}

.column-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #e0e0e0;
  transition: all 0.3s ease;
}

.column-item.column-visible::before {
  background: linear-gradient(180deg, #4caf50 0%, #388e3c 100%);
}

.column-item.column-hidden::before {
  background: linear-gradient(180deg, #f44336 0%, #d32f2f 100%);
}

.column-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #2196f3;
}

.column-item.column-visible {
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-color: #c8e6c9;
}

.column-item.column-hidden {
  background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
  border-color: #ffcdd2;
  opacity: 0.7;
}

/* Conteúdo dos itens da coluna */
.column-item-content {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: #f5f5f5;
  cursor: grab;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  background-color: #e0e0e0;
  transform: scale(1.1);
}

.drag-handle:active {
  cursor: grabbing;
  background-color: #2196f3;
}

.drag-handle:active .v-icon {
  color: white !important;
}

.column-checkbox {
  flex-shrink: 0;
}

.column-info {
  flex: 1;
  min-width: 0;
}

.column-title {
  font-weight: 600;
  color: #37474f;
  font-size: 0.9rem;
  line-height: 1.2;
}

.column-key {
  font-size: 0.75rem;
  color: #78909c;
  font-family: 'Courier New', monospace;
  margin-top: 2px;
}

.column-status {
  flex-shrink: 0;
}

.status-chip {
  font-size: 0.75rem !important;
  height: 24px !important;
}

.order-indicator {
  flex-shrink: 0;
  width: 32px;
  display: flex;
  justify-content: center;
}

/* ===== ANIMAÇÕES E TRANSIÇÕES ===== */
.column-item-enter-active,
.column-item-leave-active {
  transition: all 0.3s ease;
}

.column-item-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.column-item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.column-item-move {
  transition: transform 0.3s ease;
}

.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.2);
}

.v-chip {
  transition: all 0.3s ease;
}

/* ===== ESTADOS ESPECIAIS E ACESSIBILIDADE ===== */
.column-item[draggable="true"]:active {
  cursor: grabbing;
  transform: rotate(5deg) scale(1.05);
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.column-item:focus-within {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.v-btn:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

/* ===== RESPONSIVIDADE ===== */
@media (max-width: 768px) {
  /* Header da tabela */
  .table-header .v-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .table-header .v-col {
    width: 100%;
  }
  
  .search-field {
    max-width: 100% !important;
  }
  
  /* Tabela */
  .data-table-custom {
    font-size: 0.85rem;
  }
  
  .table-cell {
    padding: 8px 12px;
  }
  
  /* Modal */
  .column-config-modal {
    margin: 8px;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 16px !important;
  }
  
  .config-content {
    padding: 16px !important;
  }
  
  .column-item-content {
    padding: 12px;
    gap: 8px;
  }
  
  .column-title {
    font-size: 0.85rem;
  }
  
  .column-key {
    font-size: 0.7rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
