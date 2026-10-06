<!--================================================================================================================
ALTERAÇÕES: 
  - Lucas - 23/09/2025 #001 / OBS: Adicionado o relatório Sintético da consulta de log das movimentações.
  - Lucas - 20/03/2026 #002 / OBS: Otimizações de performance para grandes volumes de dados (28.000+ registros):
    * Implementada paginação eficiente (padrão: 50 itens/página, configurável até "Todos")
    * Otimizada renderização de células usando slots específicos por coluna
    * Cache de dados processados para evitar recalcular
    * Exportação Excel com processamento em chunks (1000 registros/vez)
    * Indicadores visuais de quantidade de registros com alertas para grandes volumes
    * Scroll automático ao topo ao mudar de página
    * Removido campo de busca geral (uso de filtros específicos de lote e tag)
=================================================================================================================-->

<template>
  <!-- Seção da Tabela -->
  <div v-if="mostrarTabela" class="table-section">
    <!-- Tabela principal -->
    <v-card class="table-card" elevation="3">
      <v-data-table
        :headers="headersDinamicos"
        :items="paginatedItems"
        :loading="loading"
        class="data-table-custom"
        :items-per-page="50"
        fixed-header
        :height="alturaTabela + 'px'"
        hide-default-footer
      >
        <template v-slot:top>
          <div class="table-toolbar pa-3">
            <div class="d-flex justify-space-between align-center flex-wrap ga-2">
              <div class="d-flex align-center ga-2">
                <h3 class="table-title">Log de Movimentações - Dados</h3>
                <v-chip 
                  :color="totalItems > 10000 ? 'warning' : 'success'" 
                  variant="tonal" 
                  size="small"
                  prepend-icon="mdi-database"
                >
                  {{ totalItems.toLocaleString('pt-BR') }} {{ totalItems === 1 ? 'registro' : 'registros' }}
                </v-chip>
                <v-chip
                  v-if="totalItems !== props.dados.length"
                  color="info"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-filter"
                >
                  Filtrados de {{ props.dados.length.toLocaleString('pt-BR') }}
                </v-chip>
              </div>
              <div class="d-flex ga-2 align-center flex-wrap">
                <v-select
                  v-model="tipoRelatorio"
                  chips
                  label="Relatório"
                  :items="['Analítico','Sintético']"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 150px;"
                ></v-select>
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-view-column"
                  @click="abrirModalColunas"
                >
                  Configurar Colunas
                </v-btn>
                <v-btn
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-download"
                  @click="exportarDados"
                  :disabled="dados.length === 0"
                  :loading="exportandoDados"
                >
                  Exportar Excel
                </v-btn>
              </div>
            </div>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="no-data-container">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
            <h3 class="text-grey-darken-1 mb-2">Nenhum dado encontrado</h3>
            <p class="text-grey">Configure os filtros e clique em "Filtrar" para carregar os dados.</p>
          </div>
        </template>
        
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

        <!-- Template de renderização otimizada por coluna -->
        <template v-for="header in headersDinamicos" v-slot:[`item.${header.key}`]="{ item }" :key="header.key">
          <span 
            :class="{
              'numeric-value': isNumericField(header.key),
              'date-value': isDateField(header.key),
              'text-value': !isNumericField(header.key) && !isDateField(header.key)
            }"
          >
            {{ formatCellValue(item[header.key], header.key) }}
          </span>
        </template>
      </v-data-table>
      
      <!-- Paginação Simples -->
      <v-card-actions class="pa-1 border-t d-flex justify-space-between align-center">
        <span class="text-caption text-grey-darken-1">
          Exibindo {{ startItem }} - {{ endItem }} de {{ totalItems }} registros (50 por página)
        </span>
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="compact"
          @update:model-value="onPageChange"
        ></v-pagination>
      </v-card-actions>
    </v-card>
  </div>

  <!-- Modal de Configuração de Colunas Simplificado -->
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
      
      <v-card-text class="pa-0">
        <!-- Área Principal do Configurador -->
        <div class="config-content pa-4">
          <div class="config-section">
            <div class="section-header mb-4">
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

            <!-- Lista Ordenável de Colunas -->
            <div class="columns-list">
              <transition-group 
                name="column-item" 
                tag="div" 
                class="sortable-list"
              >
                <div
                  v-for="(coluna, index) in configColunas"
                  :key="coluna.key"
                  :class="[
                    'column-item',
                    { 'column-visible': coluna.visivel, 'column-hidden': !coluna.visivel }
                  ]"
                  :draggable="true"
                  @dragstart="iniciarArrayste(index)"
                  @dragover.prevent
                  @dragenter.prevent
                  @drop="soltarItem(index)"
                  @dragend="finalizarArraste"
                >
                  <div class="column-item-content">
                    <!-- Handle de Arraste -->
                    <div class="drag-handle">
                      <v-icon size="20" color="grey-darken-1">mdi-drag-vertical</v-icon>
                    </div>

                    <!-- Checkbox -->
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

                    <!-- Badge de Status -->
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

                    <!-- Indicador de Ordem -->
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
      
      <!-- Botão de Aplicar -->
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
import { ref, computed, watch } from 'vue';
import { setColumn } from '@/stores/Consultas/setCollumn';

// Props
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
  labelMapCompleto: {
    type: Array,
    default: () => []
  },
  resumoInventario: {
    type: Object,
    default: () => ({})
  },
  tipoSelecionado: {
    type: String,
    default: ''
  },
  alturaTabela: {
    type: Number,
    default: 600
  },
  filtroLote: {
    type: String,
    default: ''
  },
  filtroTagBag: {
    type: String,
    default: ''
  }
});

// Emits
const emit = defineEmits(['atualizar']);

// Estados da paginação
const currentPage = ref(1);
// itemsPerPageConfig removido - paginação fixada em 50 itens por página

// Estados do modal de configuração de colunas
const modalColunas = ref(false);
const salvandoColunas = ref(false);
const configColunas = ref([]);
const itemArrastando = ref(null);
const tipoRelatorio = ref('Analítico');

// Estado de loading para exportação
const exportandoDados = ref(false);

// Store da API
const setColumnStore = setColumn();

// Watch para resetar página quando dados mudam
watch(() => props.dados, () => {
  currentPage.value = 1; // Reset página quando dados mudam
}, { deep: false }); // Shallow watch para performance

// Watch para monitorar mudanças no tipo de relatório e resetar página
watch(tipoRelatorio, () => {
  currentPage.value = 1;
});

// Computed para headers dinâmicos baseado no tipo de relatório
const headersDinamicos = computed(() => {
  console.log('🔄 Atualizando headers - Tipo:', tipoRelatorio.value);
  console.log('📋 Headers originais:', props.headers.map(h => h.key));
  
  // Primeiro, adiciona a coluna de sacas se não existir
  let headersComSacas = [...props.headers];
  const temSacas = headersComSacas.some(h => h.key === 'sacas');
  
  if (!temSacas) {
    // Encontra a posição da coluna de peso para inserir sacas logo após
    const indexPeso = headersComSacas.findIndex(h => h.key === 'movEnderPeso');
    
    if (indexPeso >= 0) {
      headersComSacas.splice(indexPeso + 1, 0, {
        key: 'sacas',
        title: 'Sacas',
        align: 'start',
        sortable: true
      });
      console.log('✅ Adicionada coluna Sacas após Peso na posição', indexPeso + 1);
    }
  }
  
  if (tipoRelatorio.value === 'Analítico') {
    console.log('✅ Retornando headers (Analítico)');
    return headersComSacas;
  }
  
  // Para o modo Sintético, adiciona as colunas de Data Fim e Hora Fim
  const headersSintetico = [...headersComSacas];
  
  // Verifica se as colunas de fim já existem nos headers originais
  const temDataFim = headersSintetico.some(h => h.key === 'movEnderDataFim');
  const temHoraFim = headersSintetico.some(h => h.key === 'movEnderHoraFim');
  
  console.log('🔍 Verificando colunas existentes - Data Fim:', temDataFim, 'Hora Fim:', temHoraFim);
  
  // Adiciona as colunas de Data Fim e Hora Fim se não existirem
  if (!temDataFim) {
    // Encontra a posição após a coluna de data para inserir a data fim
    const indexData = headersSintetico.findIndex(h => h.key === 'movEnderData');
    const indexHora = headersSintetico.findIndex(h => h.key === 'movEnderHora');
    
    if (indexHora >= 0) {
      // Insere Data Fim após Hora
      headersSintetico.splice(indexHora + 1, 0, {
        key: 'movEnderDataFim',
        title: 'Data Fim',
        align: 'start',
        sortable: true
      });
      console.log('✅ Adicionada coluna Data Fim após Hora na posição', indexHora + 1);
    } else if (indexData >= 0) {
      // Se não tem hora, insere após data
      headersSintetico.splice(indexData + 1, 0, {
        key: 'movEnderDataFim',
        title: 'Data Fim',
        align: 'start',
        sortable: true
      });
      console.log('✅ Adicionada coluna Data Fim após Data na posição', indexData + 1);
    }
  }
  
  if (!temHoraFim) {
    // Encontra onde inserir a Hora Fim (após Data Fim)
    const indexDataFim = headersSintetico.findIndex(h => h.key === 'movEnderDataFim');
    
    if (indexDataFim >= 0) {
      headersSintetico.splice(indexDataFim + 1, 0, {
        key: 'movEnderHoraFim',
        title: 'Hora Fim',
        align: 'start',
        sortable: true
      });
      console.log('✅ Adicionada coluna Hora Fim após Data Fim na posição', indexDataFim + 1);
    }
  }
  
  console.log('📋 Headers finais (Sintético):', headersSintetico.map(h => `${h.key} (${h.title})`));
  return headersSintetico;
});

// Watch para atualizar configuração das colunas quando headers mudam
watch(() => props.headers, (newHeaders) => {
  if (newHeaders && newHeaders.length > 0) {
    atualizarConfigColunas(newHeaders, props.labelMapCompleto);
  }
}, { immediate: true });

// Watch para atualizar quando labelMapCompleto muda
watch(() => props.labelMapCompleto, (newLabelMap) => {
  if (newLabelMap && newLabelMap.length > 0) {
    atualizarConfigColunas(props.headers, newLabelMap);
  }
}, { immediate: true });

// Watch para atualizar configuração quando tipo de relatório muda
watch(tipoRelatorio, (novoTipo) => {
  // Força atualização das colunas quando muda o tipo
  atualizarConfigColunas(headersDinamicos.value, props.labelMapCompleto);
}, { immediate: false });

// Função para atualizar configuração das colunas
const atualizarConfigColunas = (headers, labelMapCompleto = null) => {
  
  // Lista completa de todos os campos possíveis da API MovEnder
  const todosOsCamposPossiveis = [
    { key: 'oSID', title: 'ID' },
    { key: 'itOsItem', title: 'Item' },
    { key: 'bagTag', title: 'Tag Bag' },
    { key: 'bagLote', title: 'Lote' },
    { key: 'enderTag', title: 'Tag Ender' },
    { key: 'enderCod', title: 'Endereço' },
    { key: 'motCod', title: 'Usuário' },
    { key: 'movEnderData', title: 'Data Início' },
    { key: 'movEnderHora', title: 'Hora Início' },
    { key: 'movEnderDataFim', title: 'Data Fim' },
    { key: 'movEnderHoraFim', title: 'Hora Fim' },
    { key: 'movEnderTipo', title: 'Tipo' },
    { key: 'movEnderPeso', title: 'Peso' },
    { key: 'sacas', title: 'Sacas' },
    { key: 'movEnderPesoSoltar', title: 'Peso Soltar' }
  ];
  
  // Se temos labelMap completo da resposta, usa ele para saber todos os campos
  if (labelMapCompleto && Array.isArray(labelMapCompleto)) {
    
    configColunas.value = labelMapCompleto.map((item, index) => ({
      key: item.key,
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

// Computed para filtrar dados baseado nos filtros específicos
const filteredItems = computed(() => {
  let resultado = dadosProcessados.value;
  
  // Aplica filtro por lote
  if (props.filtroLote) {
    const termoLote = props.filtroLote.toLowerCase();
    resultado = resultado.filter(item => 
      item.bagLote && String(item.bagLote).toLowerCase().includes(termoLote)
    );
  }
  
  // Aplica filtro por tag bag
  if (props.filtroTagBag) {
    const termoTag = props.filtroTagBag.toLowerCase();
    resultado = resultado.filter(item => 
      item.bagTag && String(item.bagTag).toLowerCase().includes(termoTag)
    );
  }
  
  return resultado;
});

// Computed para paginação
const paginatedItems = computed(() => {
  const filtered = filteredItems.value;
  const start = (currentPage.value - 1) * 50;
  const end = start + 50;
  return filtered.slice(start, end);
});

// Computed para informações de paginação
const totalItems = computed(() => filteredItems.value.length);
const totalPages = computed(() => {
  return Math.ceil(totalItems.value / 50);
});
const startItem = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * 50 + 1;
});
const endItem = computed(() => {
  const end = currentPage.value * 50;
  return Math.min(end, totalItems.value);
});

// Computed para colunas visíveis na ordem configurada
const colunasVisiveis = computed(() => {
  return configColunas.value.filter(coluna => coluna.visivel);
});

// Cache para dados processados (evita recalcular desnecessariamente)
let cachedProcessedData = null;
let cachedHash = '';

// Computed para formatar ou não o relatório (Analítico ou Sintético)
const dadosProcessados = computed(() => {
  // Cria hash simples para cache
  const currentHash = `${tipoRelatorio.value}-${props.dados.length}`;
  
  // Se já processamos estes dados, retorna do cache
  if (cachedHash === currentHash && cachedProcessedData) {
    return cachedProcessedData;
  }
  
  console.log('🔄 Processando dados - Tipo:', tipoRelatorio.value);
  
  if (tipoRelatorio.value === 'Analítico') {
    console.log('📊 Modo Analítico - Retornando', props.dados.length, 'registros');
    // Adiciona cálculo de sacas para cada registro
    cachedProcessedData = props.dados.map(item => ({
      ...item,
      sacas: item.movEnderPeso ? (parseFloat(item.movEnderPeso) / 59).toFixed(2) : '0.00'
    }));
    cachedHash = currentHash;
    return cachedProcessedData;
  }
  
  console.log('📊 Modo Sintético - Processando', props.dados.length, 'registros');
  
  // Se for Sintético, irá agrupar por lote e somar os pesos
  const agrupados = {};
  
  props.dados.forEach(item => {
    const lote = item.bagLote;
    if (!lote) return;
    
    // Cria uma chave única para ordenação baseada em data e hora
    const dataHora = `${item.movEnderData}${item.movEnderHora}`;
    
    if (!agrupados[lote]) {
      agrupados[lote] = { 
        ...item,
        movEnderPeso: parseFloat(item.movEnderPeso) || 0,
        movEnderPesoSoltar: parseFloat(item.movEnderPesoSoltar) || 0,
        // Campos para controlar data/hora início e fim
        dataHoraInicio: dataHora,
        dataHoraFim: dataHora,
        movEnderDataFim: item.movEnderData,
        movEnderHoraFim: item.movEnderHora,
        // Array temporário para ordenação
        _registros: [{ dataHora, data: item.movEnderData, hora: item.movEnderHora }]
      };
    } else {
      // Soma os pesos
      agrupados[lote].movEnderPeso += parseFloat(item.movEnderPeso) || 0;
      agrupados[lote].movEnderPesoSoltar += parseFloat(item.movEnderPesoSoltar) || 0;
      
      // Adiciona o registro ao array temporário
      agrupados[lote]._registros.push({ 
        dataHora, 
        data: item.movEnderData, 
        hora: item.movEnderHora 
      });
      
      // Atualiza data/hora início se for anterior
      if (dataHora < agrupados[lote].dataHoraInicio) {
        agrupados[lote].dataHoraInicio = dataHora;
        agrupados[lote].movEnderData = item.movEnderData;
        agrupados[lote].movEnderHora = item.movEnderHora;
      }
      
      // Atualiza data/hora fim se for posterior
      if (dataHora > agrupados[lote].dataHoraFim) {
        agrupados[lote].dataHoraFim = dataHora;
        agrupados[lote].movEnderDataFim = item.movEnderData;
        agrupados[lote].movEnderHoraFim = item.movEnderHora;
      }
    }
  });

  // Processa os dados agrupados para o formato final
  const resultado = Object.values(agrupados);
  resultado.forEach(item => {
    // Ordena os registros por data/hora para garantir precisão
    item._registros.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
    
    // Define início e fim baseado na ordenação
    const primeiro = item._registros[0];
    const ultimo = item._registros[item._registros.length - 1];
    
    // Atualiza os campos de data/hora início
    item.movEnderData = primeiro.data;
    item.movEnderHora = primeiro.hora;
    
    // Define os campos de data/hora fim
    item.movEnderDataFim = ultimo.data;
    item.movEnderHoraFim = ultimo.hora;
    
    // Formata os valores somados para string
    item.movEnderPeso = item.movEnderPeso.toString();
    item.movEnderPesoSoltar = item.movEnderPesoSoltar.toString();
    
    // Calcula sacas (peso/59)
    item.sacas = (item.movEnderPeso / 59).toFixed(2);
    
    // Remove campos temporários
    delete item.dataHoraInicio;
    delete item.dataHoraFim;
    delete item._registros;
  });
  
  console.log('✅ Dados processados (Sintético):', resultado.length, 'lotes agrupados');
  console.log('📄 Primeiro item processado:', resultado[0]);
  
  // Armazena no cache
  cachedProcessedData = resultado;
  cachedHash = currentHash;
  
  return resultado;
});

// Função para obter ordem da coluna
const obterOrdemColuna = (index) => {
  const colunasViseisAteIndex = configColunas.value
    .slice(0, index + 1)
    .filter(coluna => coluna.visivel);
  return colunasViseisAteIndex.length;
};

// Funções para controle da paginação
const onPageChange = (page) => {
  currentPage.value = page;
  // Scroll para o topo da tabela
  const tableElement = document.querySelector('.v-data-table__wrapper');
  if (tableElement) {
    tableElement.scrollTop = 0;
  }
};

// Função removida - paginação fixada em 50 itens por página

// Funções auxiliares para formatação
const isNumericField = (fieldKey) => {
  // Exceção para numOP - não deve ser formatado como numérico
  if (fieldKey.toLowerCase() === 'numop') return false;
  
  const numericFields = ['peso', 'quant', 'quantidade', 'valor', 'val', 'num', 'qtd', 'sacas'];
  return numericFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const isDateField = (fieldKey) => {
  const dateFields = ['data', 'date', 'movenddata', 'movenddatafim'];
  return dateFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const formatNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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

// Função para formatar o bagTag
const formatBagTag = (value) => {
  if (!value) return '-';
  return value.slice(-6);
};

const formatCellValue = (value, fieldKey) => {
  if (fieldKey === 'bagTag') {
    return formatBagTag(value);
  } else if (isNumericField(fieldKey)) {
    return formatNumericValue(value);
  } else if (isDateField(fieldKey) || fieldKey.includes('Data') || fieldKey.includes('Hora')) {
    return formatDateValue(value);
  }
  return value || '-';
};

// Função para exportar dados (otimizada para grandes volumes)
const exportarDados = async () => {
  // Usa filteredItems para exportar apenas dados filtrados
  const dadosParaExportar = filteredItems.value;
  
  if (dadosParaExportar.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Alerta para grandes volumes
  if (dadosParaExportar.length > 10000) {
    const confirmar = confirm(
      `Você está exportando ${dadosParaExportar.length.toLocaleString('pt-BR')} registros.\\n\\n` +
      `Isso pode levar alguns segundos. Deseja continuar?`
    );
    if (!confirmar) return;
  }

  try {
    // Mostra loading
    exportandoDados.value = true;
    
    // Aguarda um tick para o navegador atualizar a UI
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Cria uma planilha Excel usando HTML table
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th { background-color: #37474f; color: white; font-weight: bold; padding: 8px; border: 1px solid #ccc; text-align: left; }
          td { padding: 8px; border: 1px solid #ccc; text-align: left; }
          .numeric { text-align: left; }
          .date { text-align: left; }
          .resumo { margin-bottom: 30px; }
          .resumo h2 { color: #2e7d32; margin-bottom: 15px; }
          .resumo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .resumo-card { border: 1px solid #ddd; padding: 10px; background: #f8f9fa; }
          .resumo-card strong { display: block; margin-bottom: 5px; color: #666; font-size: 12px; }
          .resumo-card .value { font-size: 16px; font-weight: bold; }
        </style>
      </head>
      <body>
    `;

    // Adiciona resumo do inventário se for do tipo Inventario
    if (props.tipoSelecionado === 'Inventario' && props.resumoInventario && Object.keys(props.resumoInventario).length > 0) {
      excelContent += `
        <div class="resumo">
          <h2>📊 Resumo do Inventário</h2>
          <div class="resumo-grid">
            <div class="resumo-card">
              <strong>Hora Início</strong>
              <div class="value">${props.resumoInventario.horaInicio || '-'}</div>
            </div>
            <div class="resumo-card">
              <strong>Hora Fim</strong>
              <div class="value">${props.resumoInventario.horaFim || '-'}</div>
            </div>
            <div class="resumo-card">
              <strong>Total de Bags</strong>
              <div class="value">${props.resumoInventario.totalBags || 0}</div>
            </div>
            <div class="resumo-card">
              <strong>Total de Sacas</strong>
              <div class="value">${props.resumoInventario.totalSacas || '0.00'}</div>
            </div>
          </div>
        </div>
      `;
    }

    excelContent += `
        <table>
          <thead>
            <tr>
    `;

    // Adiciona cabeçalhos usando headersDinamicos
    headersDinamicos.value.forEach(header => {
      excelContent += `<th>${header.title}</th>`;
    });

    excelContent += `
            </tr>
          </thead>
          <tbody>
    `;

    // Processa dados em chunks para não travar o navegador
    const chunkSize = 1000;
    const totalChunks = Math.ceil(dadosParaExportar.length / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, dadosParaExportar.length);
      const chunk = dadosParaExportar.slice(start, end);
      
      chunk.forEach(item => {
        excelContent += '<tr>';
        headersDinamicos.value.forEach(header => {
          let value = item[header.key] || '';
          let cellClass = '';
          let cellStyle = '';
          
          // Aplica formatação baseada no tipo de campo
          if (header.key === 'bagTag') {
            // Para bagTag, força formato texto para evitar notação científica
            cellStyle = 'mso-number-format:"\\@"';
            value = formatBagTag(value); // Pega últimos 6 dígitos
          } else if (header.key === 'enderTag' || header.key === 'bagLote' || header.key.toLowerCase().includes('tag')) {
            // Para outros campos de tag e lote, força formato texto
            cellStyle = 'mso-number-format:"\\@"';
            value = String(value);
          } else if (isNumericField(header.key)) {
            cellClass = 'numeric';
            value = formatNumericValue(value);
          } else if (isDateField(header.key)) {
            cellClass = 'date';
            value = formatDateValue(value);
          }
          
          // Escapa caracteres especiais para HTML
          value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          
          excelContent += `<td class="${cellClass}" ${cellStyle ? `style="${cellStyle}"` : ''}>${value}</td>`;
        });
        excelContent += '</tr>';
      });
      
      // Permite que o navegador respire entre chunks
      if (i < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

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
    
    const tipoArquivo = tipoRelatorio.value === 'Sintético' ? 'Sintetico' : 'Analitico';
    const prefixoTipo = props.tipoSelecionado === 'Inventario' ? 'Inventario_' : '';
    link.setAttribute('download', `${prefixoTipo}Log_Movimentacoes_${tipoArquivo}_${dataFormatada}_${horaFormatada}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libera a URL do blob
    URL.revokeObjectURL(url);
    
    // Mensagem informativa sobre a exportação
    const temFiltros = props.filtroLote || props.filtroTagBag;
    const mensagemFiltros = temFiltros ? ' (dados filtrados)' : '';
    console.log(`✅ Arquivo Excel exportado com sucesso! ${dadosParaExportar.length.toLocaleString('pt-BR')} registros${mensagemFiltros}`);
    
    // Alerta visual de sucesso
    if (temFiltros) {
      alert(
        `✅ Exportação concluída com sucesso!\n\n` +
        `📊 ${dadosParaExportar.length.toLocaleString('pt-BR')} registros exportados\n` +
        `🔍 Filtros aplicados: ${props.filtroLote ? `Lote: ${props.filtroLote}` : ''}${props.filtroLote && props.filtroTagBag ? ', ' : ''}${props.filtroTagBag ? `Tag: ${props.filtroTagBag}` : ''}`
      );
    }
  } catch (error) {
    console.error('❌ Erro ao exportar dados para Excel:', error);
    alert('Erro ao exportar dados para Excel');
  } finally {
    exportandoDados.value = false;
  }
};

// Funções do modal de configuração de colunas
const abrirModalColunas = () => {
  modalColunas.value = true;
};

const fecharModalColunas = () => {
  modalColunas.value = false;
};

// Funções para drag & drop
const iniciarArrayste = (index) => {
  itemArrastando.value = index;
};

const soltarItem = (indexDestino) => {
  if (itemArrastando.value === null || itemArrastando.value === indexDestino) return;
  
  const itemMovido = configColunas.value.splice(itemArrastando.value, 1)[0];
  configColunas.value.splice(indexDestino, 0, itemMovido);
  
  atualizarPrevisualizacao();
};

const finalizarArraste = () => {
  itemArrastando.value = null;
};

// Funções de controle das colunas
const selecionarTodas = () => {
  configColunas.value.forEach(coluna => {
    coluna.visivel = true;
  });
  atualizarPrevisualizacao();
};

const deselecionarTodas = () => {
  configColunas.value.forEach(coluna => {
    coluna.visivel = false;
  });
  atualizarPrevisualizacao();
};

const atualizarPrevisualizacao = () => {
  // Função para atualizar a pré-visualização (pode ser expandida se necessário)
  console.log('Pré-visualização atualizada');
};

// Presets de configuração
const aplicarPresetPadrao = () => {
  // Define colunas essenciais como padrão baseado nos campos do MovEnder
  const colunasEssenciais = ['baglote', 'enderecod', 'motcod', 'movenddata', 'movendhora', 'movenddatafim', 'movendhorafim', 'movendtipo', 'movendpeso'];
  
  configColunas.value.forEach(coluna => {
    const keyLower = coluna.key.toLowerCase();
    // Verifica se o campo está na lista de essenciais (busca parcial)
    coluna.visivel = colunasEssenciais.some(essencial => 
      keyLower.includes(essencial) || essencial.includes(keyLower)
    );
  });
  
  console.log('Preset Padrão aplicado:', configColunas.value.filter(c => c.visivel).map(c => c.key));
  atualizarPrevisualizacao();
};

const aplicarPresetMinimo = () => {
  // Define apenas colunas críticas para o preset mínimo
  const colunasCriticas = ['baglote', 'movenddata', 'movendhora', 'movendtipo', 'movendpeso'];
  
  configColunas.value.forEach(coluna => {
    const keyLower = coluna.key.toLowerCase();
    // Verifica se o campo está na lista de críticas (busca parcial)
    coluna.visivel = colunasCriticas.some(critica => 
      keyLower.includes(critica) || critica.includes(keyLower)
    );
  });
  
  console.log('Preset Mínimo aplicado:', configColunas.value.filter(c => c.visivel).map(c => c.key));
  atualizarPrevisualizacao();
};

const aplicarConfiguracaoColunas = async () => {
  salvandoColunas.value = true;
  
  try {
    // Monta o payload com as colunas na ordem configurada pelo usuário
    // Agora usando os campos reais que vieram do labelMap da API
    const colunasOrdenadas = configColunas.value.map(coluna => ({
      key: coluna.key,
      value: coluna.visivel ? 'S' : 'N'
    }));
    
    const payload = colunasOrdenadas
      .map(item => `${item.key}=${item.value}`)
      .join(',');
    
    // Parâmetros da query
    const queryParams = {
      grid: 'MovEnder',
      user: localStorage.getItem('user')
    };
    
    // Informações detalhadas para debug
    console.log('=== CONFIGURAÇÃO DE COLUNAS APLICADA ===');
    console.log('Ordem das colunas:', configColunas.value.map((col, idx) => `${idx + 1}. ${col.title} (${col.key}) - ${col.visivel ? 'Visível' : 'Oculta'}`));
    console.log('Colunas visíveis:', colunasVisiveis.value.length);
    console.log('Query Parameters:', queryParams);
    console.log('Payload enviado:', payload);
    
    // Mostra preview da configuração
    const configPreview = `
� CONFIGURAÇÃO APLICADA:

📊 Estatísticas:
• Total de colunas: ${configColunas.value.length}
• Colunas visíveis: ${colunasVisiveis.value.length}
• Colunas ocultas: ${configColunas.value.length - colunasVisiveis.value.length}

📋 Ordem das colunas visíveis:
${colunasVisiveis.value.map((col, idx) => `${idx + 1}. ${col.title}`).join('\n')}

🌐 Enviando para API:
Grid: ${queryParams.grid}
User: ${queryParams.user}
Configuração: ${payload}
    `;
    
    console.log(configPreview);
    
    // ENVIO PARA A API
    const response = await setColumnStore.setColumn(payload, queryParams);
    
    console.log('✅ Resposta da API setColumn:', response);
    
    // Fecha o modal
    modalColunas.value = false;
    
    // Emite evento para o componente pai atualizar os dados se necessário
    emit('atualizar');
    
    // Feedback de sucesso mais informativo
    alert(`✅ Configuração salva com sucesso!\n\n📊 ${colunasVisiveis.value.length} colunas ativas de ${configColunas.value.length} disponíveis\n\n🔄 Atualize os dados para ver as mudanças.`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar configuração de colunas:', error);
    alert(`❌ Erro ao salvar configuração: ${error.message}`);
  } finally {
    salvandoColunas.value = false;
  }
};
</script>

<style scoped>
/* Seção da tabela */
.table-section {
  margin-top: 1rem;
}

.table-header {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border: 1px solid #e0e0e0;
}

.table-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
}

/* Customização da tabela */
.data-table-custom {
  background-color: #fafafa;
}

.data-table-custom :deep(.v-data-table__wrapper) {
  border-radius: 0;
}

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

/* Estilo das linhas da tabela */
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

/* Células da tabela */
.table-cell {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
  text-align: left !important;
}

.numeric-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1976d2;
  text-align: left !important;
  display: block;
}

.date-value {
  font-weight: 500;
  color: #388e3c;
  text-align: left !important;
}

.text-value {
  color: #424242;
  text-align: left !important;
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

/* Estados vazios e loading */
.no-data-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

/* Paginação customizada */
.border-t {
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.v-card-actions {
  min-height: 60px;
}

.v-pagination :deep(.v-pagination__item),
.v-pagination :deep(.v-pagination__navigation) {
  box-shadow: none;
}

.v-pagination :deep(.v-pagination__item--is-active) {
  background-color: #1976d2 !important;
  color: white !important;
}


/* Responsividade */
@media (max-width: 768px) {
  .table-header .v-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .table-header .v-col {
    width: 100%;
  }
  
  .data-table-custom {
    font-size: 0.85rem;
  }
  
  .table-cell {
    padding: 8px 12px;
  }
}

/* Animações */
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

/* ===== ESTILOS DO MODAL DE CONFIGURAÇÃO DE COLUNAS ===== */

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

/* Seções do conteúdo */
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

/* Lista de Colunas Ordenável */
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

/* Animações de transição para a lista */
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

/* Responsividade */
@media (max-width: 768px) {
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

/* Estados especiais */
.column-item[draggable="true"]:active {
  cursor: grabbing;
  transform: rotate(5deg) scale(1.05);
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* Efeitos de foco e acessibilidade */
.column-item:focus-within {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.v-btn:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}
</style>
