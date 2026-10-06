<template>
  <!-- Seção Principal da Tabela de Produção/Parada -->
  <div v-if="mostrarTabela" class="table-section">

    <!-- Tabela principal customizada -->
    <v-card class="table-card" elevation="3">
      <!-- Toolbar da tabela -->
      <div class="table-toolbar pa-3">
        <div class="d-flex justify-space-between align-center">
          <h3 class="table-title">
            {{ tipoVisualizacao === 'sintetico' ? 'Relatório Sintético por OP' : 'Relatório Analítico' }}

        </h3>
            <v-select
              v-model="tipoVisualizacao"
              :items="[
                { value: 'analitico', title: 'Analítico' },
                { value: 'sintetico', title: 'Sintético' }
              ]"
              label="Tipo de Visualização"
              variant="outlined"
              density="compact"
              hide-details
              class="tipo-select"
              style="min-width: 180px;"
            />
            <v-col cols="12" md="4" class="d-flex align-center ga-2">            
            <v-text-field
              v-model="buscaLocal"
              label="Buscar na tabela..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              style="max-width: 300px;"
              class="search-field"
              @input="$emit('update:busca', buscaLocal)"
            /></v-col>
            
                        <v-tooltip text="Configurar Colunas">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-cog"
                  variant="outlined"
                  size="small"
                  @click="abrirModalColunas"
                  :disabled="tipoVisualizacao === 'sintetico'"
                />
            <v-col cols="12" md="2" class="d-flex justify-end ga-2">
                <v-btn
                size="small"
                color="success"
                variant="tonal"
                prepend-icon="mdi-microsoft-excel"
                @click="exportarDados"
                v-if="dadosProcessados.length > 0"
                >
                Exportar Excel
                </v-btn>
            </v-col>
              </template>
            </v-tooltip>
        </div>
      </div>

      <!-- Container da Tabela -->
      <div class="table-container">
        <v-data-table
          :headers="headersAtivos"
          :items="dadosProcessados"
          :loading="loading"
          class="data-table-custom elevation-1"
          item-value="id"
          v-model:expanded="expanded"
          density="comfortable"
          height= 400px
          fixed-header
          hide-default-footer
          :items-per-page="-1"
        >
          <!-- Slot para células customizadas -->
          <template v-slot:item="{ item, columns }">
            <tr 
              :class="['table-row-hover', tipoVisualizacao === 'sintetico' ? 'clickable-row' : '']"
              :key="item.id"
              @click="tipoVisualizacao === 'sintetico' ? toggleExpansion(item) : null"
            >
              
              <!-- Células de dados -->
              <td 
                v-for="column in (tipoVisualizacao === 'sintetico' ? headersSinteticos : colunasVisiveis)"
                :key="column.key" 
                :class="['table-cell', getCellClass(column.key)]"
                :style="{ textAlign: column.align || 'start' }"
              >
                <!-- Conteúdo da célula com formatação -->
                <div class="cell-content">
                  <template v-if="column.key === 'parTipo' && tipoVisualizacao === 'analitico'">
                    <v-chip
                      :color="getTipoColor(obterValorDoItem(item, column.key))"
                      size="small"
                      variant="elevated"
                    >
                      {{ obterValorDoItem(item, column.key) }}
                    </v-chip>
                  </template>
                  
                  <template v-else-if="column.key === 'maquinarios' && tipoVisualizacao === 'sintetico'">
                    <v-chip-group>
                      <v-chip
                        v-for="maq in (obterValorDoItem(item, column.key) || '').split(', ').filter(m => m)"
                        :key="maq"
                        size="x-small"
                        variant="outlined"
                        color="primary"
                      >
                        {{ maq }}
                      </v-chip>
                    </v-chip-group>
                  </template>
                  
                  <template v-else-if="column.key === 'operadores' && tipoVisualizacao === 'sintetico'">
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props: tooltipProps }">
                        <v-chip
                          v-bind="tooltipProps"
                          size="small"
                          color="secondary"
                          variant="elevated"
                          class="operadores-chip"
                        >
                          {{ (obterValorDoItem(item, column.key) || '').split(', ').filter(o => o).length }} operador(es)
                        </v-chip>
                      </template>
                      <div class="operadores-tooltip">
                        <div class="tooltip-title">Operadores:</div>
                        <div 
                          v-for="op in (obterValorDoItem(item, column.key) || '').split(', ').filter(o => o)"
                          :key="op"
                          class="operador-item"
                        >
                          • {{ op }}
                        </div>
                      </div>
                    </v-tooltip>
                  </template>
                  <template v-else-if="column.key === 'producao' && tipoVisualizacao === 'sintetico'">
                    <v-btn
                      color="success"
                      variant="tonal"
                      size="small"
                      prepend-icon="mdi-package-variant-closed"
                      @click.stop="abrirModalProducao(item)" 
                    ><!-- "@click.stop" Serve para não abrir as linhas sem querer -->
                      Produção
                    </v-btn>
                  </template>
                  
                  <template v-else>
                    {{ formatCellValue(obterValorDoItem(item, column.key), column.key) }}
                  </template>
                </div>
              </td>
            </tr>
          </template>

          <!-- Slot para linha expandida com detalhes (modo sintético) -->
          <template v-slot:expanded-row="{ columns, item }" v-if="tipoVisualizacao === 'sintetico'">
            <tr>
              <td :colspan="columns.length" class="pa-0">
                <v-card flat class="ma-2">
                  <v-card-text class="pa-0">
                    <v-data-table
                      :headers="headersAnaliticoExpandido"
                      :items="item._registrosOriginais"
                      density="compact"
                      class="elevation-0"
                      hide-default-footer
                      :items-per-page="-1"
                      fixed-header
                      height="400px"
                    >
                      <!-- Formatação customizada para tipo -->
                      <template v-slot:item.parTipo="{ item: registro }">
                        <v-chip
                          :color="getTipoColor(registro.parTipo)"
                          size="small"
                          variant="elevated"
                        >
                          {{ registro.parTipo }}
                        </v-chip>
                      </template>

                      <!-- Formatação customizada para maquinário -->
                      <template v-slot:item.maqCod="{ item: registro }">
                        {{ getMaquinarioNome(registro.maqCod) }}
                      </template>

                      <!-- Formatação customizada para data inicial -->
                      <template v-slot:item.parDataIni="{ item: registro }">
                        {{ formatarData(registro.parDataIni) }}
                      </template>

                      <!-- Formatação customizada para data final -->
                      <template v-slot:item.parDataFim="{ item: registro }">
                        {{ formatarData(registro.parDataFim) }}
                      </template>

                      <!-- Formatação customizada para hora inicial -->
                      <template v-slot:item.parHoraIni="{ item: registro }">
                        {{ formatarHoraSimples(registro.parHoraIni) }}
                      </template>

                      <!-- Formatação customizada para hora final -->
                      <template v-slot:item.parHoraFim="{ item: registro }">
                        {{ formatarHoraSimples(registro.parHoraFim) }}
                      </template>

                      <!-- Calcula e exibe duração -->
                      <template v-slot:item.duracao="{ item: registro }">
                        <v-chip size="small" color="info" variant="outlined">
                          {{ formatarHoras(calcularDiferencaHoras(
                            registro.parDataIni, 
                            registro.parHoraIni, 
                            registro.parDataFim, 
                            registro.parHoraFim
                          )) }}
                        </v-chip>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </td>
            </tr>
          </template>

          <!-- Slot para estado vazio -->
          <template v-slot:no-data>
            <div class="text-center pa-8 no-data-container">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
              <h3 class="text-grey-darken-1 mb-2">Nenhum dado encontrado</h3>
              <p class="text-grey">Configure os filtros e clique em "Filtrar" para carregar os dados.</p>
            </div>
          </template>

          <!-- Slot para loading -->
          <template v-slot:loading>
            <div class="text-center pa-8 loading-container">
              <v-progress-circular
                indeterminate
                color="primary"
                size="64"
              ></v-progress-circular>
              <p class="mt-4 text-grey">Carregando dados...</p>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>
  </div>

  <!-- Modal de Configuração de Colunas -->
  <v-dialog v-model="modalColunas" max-width="600" persistent>
    <v-card class="column-config-modal">
      <!-- Header do Modal -->
      <div class="modal-header pa-4">
        <div class="d-flex justify-space-between align-center">
          <h3 class="modal-title">Configurar Colunas</h3>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            class="close-btn"
            @click="fecharModalColunas"
          />
        </div>
      </div>

      <!-- Conteúdo do Modal -->
      <v-card-text class="config-content pa-0">
        <!-- Seção de Informações -->
        <div class="pa-4 border-b">
          <div class="section-header mb-3">
            <v-icon class="mr-2" color="info">mdi-information</v-icon>
            <span class="text-subtitle-1 font-weight-medium">Gerenciar Colunas</span>
          </div>
          
          <div class="section-stats mb-3">
            <v-chip size="small" color="success" variant="outlined" class="mr-2">
              {{ colunasVisiveis.length }} visíveis
            </v-chip>
            <v-chip size="small" color="warning" variant="outlined">
              {{ configColunas.filter(c => !c.visivel).length }} ocultas
            </v-chip>
          </div>
          
          <div class="section-actions">
            <v-btn
              size="small"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-check-all"
              @click="selecionarTodas"
              class="mr-2"
            >
              Selecionar Todas
            </v-btn>
            <v-btn
              size="small"
              color="error"
              variant="outlined"
              prepend-icon="mdi-close-box-multiple"
              @click="deselecionarTodas"
            >
              Desmarcar Todas
            </v-btn>
          </div>
        </div>

        <!-- Lista de Colunas Ordenável -->
        <div class="pa-4" style="max-height: 400px; overflow-y: auto;">
          <transition-group name="column-item" tag="div" class="sortable-list">
            <div
              v-for="(coluna, index) in configColunas"
              :key="coluna.key"
              :class="getColumnItemClass(coluna)"
              draggable="true"
              @dragstart="iniciarArraste(index)"
              @dragend="finalizarArraste"
              @dragover.prevent
              @drop.prevent="soltarItem(index)"
            >
              <div class="column-item-content d-flex align-center">
                <!-- Handle de arrastar -->
                <div class="drag-handle mr-3">
                  <v-icon size="small" color="grey-darken-1">mdi-drag-vertical</v-icon>
                </div>

                <!-- Checkbox de visibilidade -->
                <v-checkbox
                  v-model="coluna.visivel"
                  class="column-checkbox mr-3"
                  hide-details
                  density="compact"
                  @change="atualizarPrevisualizacao"
                />

                <!-- Informações da coluna -->
                <div class="column-info flex-grow-1">
                  <div class="column-title text-body-2 font-weight-medium">
                    {{ coluna.title }}
                  </div>
                  <div class="column-key text-caption text-grey-darken-1">
                    {{ coluna.key }}
                  </div>
                </div>

                <!-- Status da coluna -->
                <div class="column-status">
                  <v-chip
                    v-if="coluna.visivel"
                    size="x-small"
                    color="success"
                    variant="elevated"
                    class="status-chip"
                  >
                    {{ obterOrdemColuna(index) }}°
                  </v-chip>
                  <v-chip
                    v-else
                    size="x-small"
                    color="grey"
                    variant="outlined"
                    class="status-chip"
                  >
                    Oculta
                  </v-chip>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </v-card-text>

      <!-- Footer do Modal -->
      <v-card-actions class="pa-4 border-t">
        <v-spacer />
        <v-btn
          color="grey"
          variant="outlined"
          @click="fecharModalColunas"
          :disabled="salvandoColunas"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="aplicarConfiguracaoColunas"
          :loading="salvandoColunas"
          :disabled="colunasVisiveis.length === 0"
        >
          Aplicar Configuração
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <!-- Modal de produção por lote -->
  <v-dialog v-model="modalProducao" max-width="800px">
    <v-card>
      <v-card-title class="d-flex align-center bg-success text-white pa-3">
        <v-icon class="mr-2">mdi-package-variant-closed</v-icon>
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            Produção da OP {{ linhaProducaoSelecionada?.parOP }}
          </div>

          <div class="text-caption">
            Lotes utilizadas na produção
          </div>
        </div>

        <v-spacer />

        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          @click="modalProducao = false"  
        />
      </v-card-title>

      <v-card-text class="pa-4">
        <v-table density="compact" class="elevation-1 rounded">
          <thead>
            <tr>
              <th class="font-weight-bold">Lote</th>
              <th class="font-weight-bold">Sacas</th>
              <th class="font-weight-bold">Qtd. Vento</th>
              <th class="font-weight-bold">Qtd. Cate</th>
            </tr>
          </thead>

          <tbody>
            <!-- Carregamento -->
            <tr v-if="loadingLotesProducao">
              <td colspan="4" class="text-center py-5">
                <v-progress-circular
                  indeterminate
                  color="success"
                  size="24"
                  class="mr-2"
                />

                Carregando produção...
              </td>
            </tr>

            <!-- Dados -->
             <template v-else>
              <tr
                v-for="item in lotesProducao"
                :key="item.lote"
              >
                <td>{{ item.lote }}</td>

                <td class="text-right">{{ item.sacas.toFixed(2) }}</td>

                <td class="text-right">{{ item.qtdVento }}</td>

                <td class="text-right">{{ item.qtdCate }}</td>
              </tr>

              <!-- Nenhum resultado -->
              <tr v-if="lotesProducao.length === 0">
                <td colspan="4" class="text-center text-grey py-5">
                  Nenhum lote encontrado para está OP
                </td>
              </tr>
             </template>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer/>
          <v-btn color="success" variant="elevated" @click="modalProducao = false">
            Fechar
          </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { setColumn } from '@/stores/Consultas/setCollumn';
import { maquinario } from '@/stores/Consultas/getMaquinario';
import { motivoParada } from '@/stores/Consultas/getMotivoParada';
import { getZ71Prod } from '@/stores/Consultas/getZ71Prod';

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
const tipoVisualizacao = ref('analitico'); // 'analitico' ou 'sintetico'
const expanded = ref([]);
const modalProducao = ref(false);
const linhaProducaoSelecionada = ref(null);
const loadingLotesProducao = ref(false);
const lotesProducao = ref([]);

async function abrirModalProducao(item) {
  linhaProducaoSelecionada.value = item;
  modalProducao.value = true;
  lotesProducao.value = [];

  const opNumerico = String(item.parOP ?? '').replace(/\D/g, '');

  if (!opNumerico) {
    console.error('Esta linha não possui um OP válida:', item.parOP);
    return;
  }

  loadingLotesProducao.value = true;

  try {
    const resposta = await getZ71ProdStore.getZ71Prod({
      opticket: opNumerico
    });

    console.log('Consulta com OP numérica:', opNumerico, resposta);

    if (Array.isArray(resposta) && resposta.length === 0) {
      const opCompleta = String(item.parOP ?? '').trim();

      const respostaCompleta = await getZ71ProdStore.getZ71Prod({
        opticket: opCompleta
      });

      console.log('Consulta com OP completa:', opCompleta, respostaCompleta);
    }

    const registros = Array.isArray(resposta)
      ? resposta
      : Array.isArray(resposta?.data)
        ? resposta.data
        : Array.isArray(resposta?.retorno)
          ? resposta.retorno
          : [];

    const lotes = new Map();

    for (const registro of registros) {
      const loteCompleto = String(registro.lote ?? '').trim();
      if (!loteCompleto) continue;

      //Mesmo formato usado para monitoramento de produção
      const indiceOP = loteCompleto.indexOf(opNumerico);
      const lote = indiceOP === -1 ? loteCompleto : loteCompleto.slice(indiceOP + opNumerico.length).replace(/^[-_\s]+/, '') || loteCompleto;
      const sacas = Number(String(registro.sacas ?? 0).replace(',', '.')) || 0;
      if (!lotes.has(lote)) {
        lotes.set(lote, {
          lote,
          sacas: 0,
          qtdVento: '-',
          qtdCate: '-'
        });
      }

      lotes.get(lote).sacas += sacas;
    }
    lotesProducao.value = [...lotes.values()].sort((a, b) => a.lote.localeCompare(b.lote, 'pt-BR', { numeric: true }));
    console.table(registros.map(r => ({
      lote: r.lote,
      data: r.data,
      hora: r.hora,
      setor: r.setor,
      linha: r.linha,
      sacas: r.sacas
    })));
  } catch (error) {
    console.error('Erro ao buscar lotes da OP:', error);
  } finally {
    loadingLotesProducao.value = false;
  }

  console.log('Linha selecionada:',item);
  console.log('OP selecionada:',item.parOP);
}

// Estados do modal de configuração
const modalColunas = ref(false);
const salvandoColunas = ref(false);
const configColunas = ref([]);
const itemArrastando = ref(null);

// Store da API
const setColumnStore = setColumn();
const maquinarioStore = maquinario();
const motivoParadaStore = motivoParada();
const getZ71ProdStore = getZ71Prod();

// Dados de maquinários e motivos
const maquinarios = ref([]);
const motivos = ref([]);

// ===== CONFIGURAÇÕES CONSTANTES =====
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
  { title: 'Início Geral', key: 'inicioGeral', align: 'start', sortable: true },
  { title: 'Operadores', key: 'operadores', align: 'start', sortable: true },
  { title: 'Tempo Produção', key: 'tempoProducao', align: 'start', sortable: true },
  { title: 'Tempo Parada', key: 'tempoParada', align: 'start', sortable: true },
  { title: 'Tempo Total', key: 'totalHoras', align: 'start', sortable: true },
  { title: 'Registros', key: 'quantidadeRegistros', align: 'start', sortable: true },
  { title: 'Produção', key: 'producao', align: 'start', sortable: true }
]);

// Headers para detalhes do modo sintético (quando expandir)
const headersDetalheSintetico = computed(() => [
  { title: 'Tipo', key: 'parTipo', align: 'start', sortable: false },
  { title: 'Total de Horas', key: 'totalHoras', align: 'start', sortable: false },
  { title: 'Registros', key: 'quantidadeRegistros', align: 'start', sortable: false }
]);

// Headers analíticos para expansão no modo sintético
const headersAnaliticoExpandido = computed(() => [
  { title: 'ID', key: 'parID', align: 'start', sortable: true },
  { title: 'Tipo', key: 'parTipo', align: 'start', sortable: true },
  { title: 'Maquinário', key: 'maqCod', align: 'start', sortable: true },
  { title: 'Data Inicial', key: 'parDataIni', align: 'start', sortable: true },
  { title: 'Hora Inicial', key: 'parHoraIni', align: 'start', sortable: true },
  { title: 'Data Final', key: 'parDataFim', align: 'start', sortable: true },
  { title: 'Hora Final', key: 'parHoraFim', align: 'start', sortable: true },
  { title: 'Duração', key: 'duracao', align: 'start', sortable: false },
  { title: 'Usuário', key: 'userCod', align: 'start', sortable: true },
  { title: 'Motivo', key: 'parMotivo', align: 'start', sortable: true },
  { title: 'Qtd Vez', key: 'parQtdVez', align: 'end', sortable: true },
  { title: 'Peneira', key: 'parPeneira', align: 'start', sortable: true }
]);

// Headers ativos baseados no tipo de visualização
const headersAtivos = computed(() => {
  return tipoVisualizacao.value === 'sintetico' ? headersSinteticos.value : props.headers;
});

// Dados sintéticos agrupados
const dadosSinteticos = computed(() => {
  if (tipoVisualizacao.value !== 'sintetico') return [];
  
  // Agrupa por OP e Maquinário
  const agrupamentoPorOPeMaquinario = {};
  
  props.dados.forEach(item => {
    const op = item.parOP || 'SEM_OP';
    const tipo = item.parTipo || 'INDEFINIDO';
    const maqCod = item.maqCod || '';
    const userCod = item.userCod || '';
    
    // Cria chave única combinando OP e Maquinário
    const chaveAgrupamento = `${op}_${maqCod}`;
    
    // Inicializa OP + Maquinário se não existir
    if (!agrupamentoPorOPeMaquinario[chaveAgrupamento]) {
      agrupamentoPorOPeMaquinario[chaveAgrupamento] = {
        id: `op_maq_${op}_${maqCod}`,
        parOP: op,
        maqCod: maqCod,
        maquinarios: new Set(),
        operadores: new Set(),
        tempoProducao: 0,
        tempoParada: 0,
        totalHoras: 0,
        quantidadeRegistros: 0,
        inicioGeral: '-',
        _detalhes: {},
        _registrosOriginais: [] // Adiciona array para armazenar registros originais
      };
    }
    
    // Adiciona o registro original completo
    agrupamentoPorOPeMaquinario[chaveAgrupamento]._registrosOriginais.push(item);
    
    // Adiciona maquinário e operador aos sets
    if (maqCod) {
      const nomeMaq = maquinarioMap.value[maqCod] || maqCod;
      agrupamentoPorOPeMaquinario[chaveAgrupamento].maquinarios.add(nomeMaq);
    }
    if (userCod) {
      agrupamentoPorOPeMaquinario[chaveAgrupamento].operadores.add(userCod);
    }
    
    // Calcula horas para este registro
    const horas = calcularDiferencaHoras(
      item.parDataIni, item.parHoraIni, 
      item.parDataFim, item.parHoraFim
    );
    
    // Soma ao total geral
    agrupamentoPorOPeMaquinario[chaveAgrupamento].totalHoras += horas;
    agrupamentoPorOPeMaquinario[chaveAgrupamento].quantidadeRegistros += 1;
    
    // Soma por tipo
    if (tipo === 'PRO') {
      agrupamentoPorOPeMaquinario[chaveAgrupamento].tempoProducao += horas;
    } else {
      agrupamentoPorOPeMaquinario[chaveAgrupamento].tempoParada += horas;
    }
    
    // Inicializa detalhes por tipo se não existir
    if (!agrupamentoPorOPeMaquinario[chaveAgrupamento]._detalhes[tipo]) {
      agrupamentoPorOPeMaquinario[chaveAgrupamento]._detalhes[tipo] = {
        totalHoras: 0,
        quantidadeRegistros: 0
      };
    }
    
    // Soma aos detalhes por tipo
    agrupamentoPorOPeMaquinario[chaveAgrupamento]._detalhes[tipo].totalHoras += horas;
    agrupamentoPorOPeMaquinario[chaveAgrupamento]._detalhes[tipo].quantidadeRegistros += 1;
  });
  
  // Converte objeto em array e formata horas
  return Object.values(agrupamentoPorOPeMaquinario).map((grupo, index) => ({
    ...grupo,
    id: `op_maq_${grupo.parOP}_${grupo.maqCod}_${index}`,
    maquinarios: Array.from(grupo.maquinarios).join(', '),
    operadores: Array.from(grupo.operadores).join(', '),
    inicioGeral: obterInicioGeral(grupo._registrosOriginais, grupo.maqCod),
    tempoProducao: formatarHoras(grupo.tempoProducao),
    tempoParada: formatarHoras(grupo.tempoParada),
    totalHoras: formatarHoras(grupo.totalHoras)
  }));
});

// Dados processados baseados no tipo de visualização
const dadosProcessados = computed(() => {
  const dados = tipoVisualizacao.value === 'sintetico' ? dadosSinteticos.value : filteredItems.value;
  
  // Aplica busca se houver
  if (!buscaLocal.value) return dados;
  
  const termoBusca = buscaLocal.value.toLowerCase();
  return dados.filter(item => {
    return Object.values(item).some(valor => {
      if (valor === null || valor === undefined) return false;
      return String(valor).toLowerCase().includes(termoBusca);
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
    const dataA = a.parDataIni || '';
    const horaA = a.parHoraIni || '';
    const dataB = b.parDataIni || '';
    const horaB = b.parHoraIni || '';
    
    // Compara primeiro por data
    const compareData = dataA.localeCompare(dataB);
    if (compareData !== 0) return compareData;
    
    // Se as datas são iguais, compara por hora
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
    // Converte data de YYYYMMDD para YYYY-MM-DD se necessário
    const formatarData = (data) => {
      if (typeof data === 'string' && data.length === 8) {
        return `${data.substring(0, 4)}-${data.substring(4, 6)}-${data.substring(6, 8)}`;
      }
      return data;
    };
    
    // Formatar hora para HH:MM se necessário
    const formatarHora = (hora) => {
      if (typeof hora === 'string') {
        if (hora.length === 6) { // HHMMSS
          return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:${hora.substring(4, 6)}`;
        } else if (hora.length === 4) { // HHMM
          return `${hora.substring(0, 2)}:${hora.substring(2, 4)}:00`;
        }
      }
      return hora;
    };
    
    const dataIniFormatada = formatarData(dataIni);
    const horaIniFormatada = formatarHora(horaIni);
    const dataFimFormatada = formatarData(dataFim);
    const horaFimFormatada = formatarHora(horaFim);
    
    const inicio = new Date(`${dataIniFormatada}T${horaIniFormatada}`);
    const fim = new Date(`${dataFimFormatada}T${horaFimFormatada}`);
    
    const diferencaMs = fim.getTime() - inicio.getTime();
    const horas = diferencaMs / (1000 * 60 * 60); // Converte para horas
    
    return horas > 0 ? horas : 0;
  } catch (error) {
    console.warn('Erro ao calcular diferença de horas:', error);
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
    case 'PRO': return 'success';
    case 'PAR': return 'warning';
    case 'PRF': return 'error';
    default: return 'grey';
  }
};

/**
 * Formata data do formato YYYYMMDD para DD/MM/YYYY
 */
const formatarData = (data) => {
  if (!data) return '-';
  if (typeof data === 'string' && data.length === 8) {
    return `${data.substring(6, 8)}/${data.substring(4, 6)}/${data.substring(0, 4)}`;
  }
  return data;
};

/**
 * Formata hora do formato HHMMSS ou HHMM para HH:MM
 */
const formatarHoraSimples = (hora) => {
  if (!hora) return '-';
  if (typeof hora === 'string') {
    if (hora.length === 6) { // HHMMSS
      return `${hora.substring(0, 2)}:${hora.substring(2, 4)}`;
    } else if (hora.length === 4) { // HHMM
      return `${hora.substring(0, 2)}:${hora.substring(2, 4)}`;
    }
  }
  return hora;
};

const isClassificador = (maqCod) => ['007', '008'].includes(String(maqCod || '').padStart(3, '0'));

const obterInicioGeral = (registros, maqCod) => {
  const candidatos = isClassificador(maqCod)
    ? registros.filter(registro => ['PRO', 'PRF'].includes(registro.parTipo))
    : registros;

  const primeiro = [...candidatos].sort((a, b) => {
    const dataA = a.parDataIni || '';
    const horaA = a.parHoraIni || '';
    const dataB = b.parDataIni || '';
    const horaB = b.parHoraIni || '';
    return `${dataA}${horaA}`.localeCompare(`${dataB}${horaB}`);
  })[0];

  if (!primeiro) return '-';
  return `${formatarData(primeiro.parDataIni)} ${formatarHoraSimples(primeiro.parHoraIni)}`;
};

/**
 * Retorna nome do maquinário pelo código
 */
const getMaquinarioNome = (maqCod) => {
  if (!maqCod) return '-';
  return maquinarioMap.value[maqCod] || maqCod;
};

/**
 * Retorna código + descrição do motivo de parada
 */
const getMotivoDescricao = (motCod) => {
  if (!motCod) return '-';
  return motivoParadaStore.getDescricaoMotivoMaquinario(motCod);
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
 * Verifica se o campo é motivo de parada
 */
const isMotivoField = (fieldKey) => {
  const motivoFields = ['parMotivo', 'motivo', 'motCod'];
  return motivoFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
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
  if (isMotivoField(fieldKey)) return 'motivo-value';
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
    coluna.visivel ? 'column-visible' : 'column-hidden'
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
    const ano = value.substring(0, 4);
    const mes = value.substring(4, 6);
    const dia = value.substring(6, 8);
    return `${dia}/${mes}/${ano}`;
  }
  return value;
};

/**
 * Formata valor da célula baseado no tipo do campo
 */
const formatCellValue = (value, fieldKey) => {
  if (fieldKey === 'totalHoras' || fieldKey === 'tempoProducao' || fieldKey === 'tempoParada') {
    // Estes campos já vêm formatados do computed
    return value || '0h 00min';
  } else if (fieldKey === 'quantidadeRegistros') {
    return value || '0';
  } else if (fieldKey === 'maquinarios' || fieldKey === 'operadores') {
    return value || '-';
  } else if (isIdField(fieldKey)) {
    if (value === null || value === undefined || value === '') return '-';
    const num = parseFloat(value);
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
  } else if (isMotivoField(fieldKey)) {
    return getMotivoDescricao(value);
  }
  return value || '-';
};

// ===== FUNÇÕES DE CONTROLE DE EXPANSÃO =====
/**
 * Toggle expansão de item
 */
const toggleExpansion = (item) => {
  const itemId = item.id;
  const index = expanded.value.findIndex(id => id === itemId);
  if (index > -1) {
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(itemId);
  }
};

// ===== FUNÇÕES DE CONFIGURAÇÃO DE COLUNAS =====
/**
 * Atualiza configuração das colunas baseado nos headers e labelMap
 */
const atualizarConfigColunas = (headers, labelMapCompleto = null) => {
  // Se temos labelMap completo da resposta, usa ele para saber todos os campos
  if (labelMapCompleto && Array.isArray(labelMapCompleto)) {
    configColunas.value = labelMapCompleto.map((campo, index) => ({
      key: campo.key || campo.name,
      title: campo.title || campo.label || campo.name,
      visivel: headers ? headers.some(h => h.key === (campo.key || campo.name)) : index < 10
    }));
  } 
  // Se não temos labelMap completo, mas temos headers ativos, complementa com os possíveis
  else if (headers && headers.length > 0) {
    const headersMap = new Map();
    
    // Primeiro adiciona os headers ativos
    headers.forEach(header => {
      headersMap.set(header.key, {
        key: header.key,
        title: header.title,
        visivel: true
      });
    });
    
    // Depois adiciona os campos possíveis que não estão nos headers
    todosOsCamposPossiveis.forEach(campo => {
      if (!headersMap.has(campo.key)) {
        headersMap.set(campo.key, {
          key: campo.key,
          title: campo.title,
          visivel: false
        });
      }
    });
    
    configColunas.value = Array.from(headersMap.values());
  }
  // Fallback: usa apenas a lista de campos possíveis
  else {
    configColunas.value = todosOsCamposPossiveis.map((campo, index) => ({
      key: campo.key,
      title: campo.title,
      visivel: index < 5 // Primeiros 5 visíveis por padrão
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
    .slice(0, index)
    .filter(coluna => coluna.visivel);
  return colunasViseisAteIndex.length + 1;
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
    // Usando o mesmo formato do logTable.vue que funciona
    const colunasOrdenadas = configColunas.value.map(coluna => ({
      key: normalizarChave(coluna.key), // Normaliza para primeira letra minúscula
      value: coluna.visivel ? 'S' : 'N'
    }));
    
    const payload = colunasOrdenadas
      .map(item => `${item.key}=${item.value}`)
      .join(',');

    // Parâmetros da query
    const queryParams = {
      grid: 'ProdPar', 
      user: localStorage.getItem('user')
    };

    console.log('Payload enviado para setColumn:', payload);

    // Salva a configuração na API usando o método correto
    const response = await setColumnStore.setColumn(payload, queryParams);

    // Emite evento para atualizar a tabela pai
    emit('atualizar');
    
    // Fecha o modal
    fecharModalColunas();
    
    alert(`✅ Configuração salva com sucesso!\n\n📊 ${colunasVisiveis.value.length} colunas ativas de ${configColunas.value.length} disponíveis\n\n🔄 Atualize os dados para ver as mudanças.`);
    
  } catch (error) {
    console.error('❌ Erro ao salvar configuração de colunas:', error);
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
          .detalhes-header { background-color: #78909c; color: white; font-weight: bold; }
          .detalhes-row { background-color: #f5f5f5; }
          .separador { height: 10px; background-color: white; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
    `;

    // Adiciona cabeçalhos principais
    headersAtivos.value.forEach(header => {
      excelContent += `<th>${header.title}</th>`;
    });

    excelContent += `
            </tr>
          </thead>
          <tbody>
    `;

    // Adiciona dados baseado no tipo de visualização
    const dadosParaExportar = tipoVisualizacao.value === 'sintetico' ? dadosSinteticos.value : props.dados;
    
    dadosParaExportar.forEach((item, index) => {
      // Linha do cabeçalho principal
      excelContent += '<tr style="background-color: #e0e0e0; font-weight: bold;">';
      headersAtivos.value.forEach(header => {
        let value = obterValorDoItem(item, header.key) || '';
        
        // Aplica formatação específica para cada tipo de campo
        if (isMotivoField(header.key)) {
          value = getMotivoDescricao(value);
        } else if (isMaquinarioField(header.key)) {
          value = getMaquinarioNome(value);
        } else if (isDateField(header.key)) {
          value = formatDateValue(value);
        } else if (isTimeField(header.key)) {
          value = value || '-';
        } else if (isNumericField(header.key)) {
          value = formatNumericValue(value);
        }
        
        // Escapa caracteres especiais para HTML
        value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        excelContent += `<td>${value}</td>`;
      });
      excelContent += '</tr>';

      // Se existem detalhes no modo sintético, adiciona a seção de detalhes
      if (tipoVisualizacao.value === 'sintetico' && item._detalhes && Object.keys(item._detalhes).length > 0) {
        // Linha de título dos detalhes
        excelContent += `<tr class="detalhes-header">`;
        excelContent += `<td colspan="${headersAtivos.value.length}" style="background-color: #78909c; color: white; font-weight: bold; padding: 8px;">DETALHES DA OP ${item.parOP}</td>`;
        excelContent += `</tr>`;

        // Cabeçalhos dos detalhes
        excelContent += '<tr class="detalhes-header">';
        headersDetalheSintetico.value.forEach(header => {
          excelContent += `<th style="background-color: #90a4ae; color: white;">${header.title}</th>`;
        });
        // Preenche colunas vazias restantes se necessário
        const colunasRestantes = headersAtivos.value.length - headersDetalheSintetico.value.length;
        for (let i = 0; i < colunasRestantes; i++) {
          excelContent += `<th style="background-color: #90a4ae;"></th>`;
        }
        excelContent += '</tr>';

        // Linhas de detalhes
        Object.entries(item._detalhes).forEach(([tipo, dados]) => {
          excelContent += '<tr class="detalhes-row">';
          excelContent += `<td>${tipo}</td>`;
          excelContent += `<td>${formatarHoras(dados.totalHoras)}</td>`;
          excelContent += `<td>${dados.quantidadeRegistros}</td>`;
          // Preenche colunas vazias restantes
          for (let i = 0; i < colunasRestantes; i++) {
            excelContent += `<td></td>`;
          }
          excelContent += '</tr>';
        });
      }

      // Linha separadora entre registros (exceto no último)
      if (index < dadosParaExportar.length - 1) {
        excelContent += `<tr class="separador"><td colspan="${headersAtivos.value.length}"></td></tr>`;
      }
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
    
    const tipoArquivo = tipoVisualizacao.value === 'sintetico' ? 'Sintetico' : 'Analitico';
    link.setAttribute('download', `Relatorio_Producao_Parada_${tipoArquivo}_${dataFormatada}_${horaFormatada}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libera a URL do blob
    URL.revokeObjectURL(url);
    
    console.log('Arquivo Excel exportado com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar dados para Excel:', error);
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
    if (response && Array.isArray(response)) {
      maquinarios.value = response;
    }
  } catch (error) {
    console.error('Erro ao carregar maquinários:', error);
  }
};

/**
 * Carrega motivos de parada ao montar o componente
 */
const carregarMotivos = async () => {
  try {
    // Carrega motivos gerais
    await motivoParadaStore.getMotivoParada();
    
    // Carrega motivos específicos por maquinário (todos)
    const response = await motivoParadaStore.getMotivoParadaMaquinario('');
    if (response && Array.isArray(response)) {
      motivos.value = response;
    }
  } catch (error) {
    console.error('Erro ao carregar motivos de parada:', error);
  }
};

onMounted(() => {
  carregarMaquinarios();
  carregarMotivos();
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
  border-color: #1976d2;
}

.tipo-select :deep(.v-field) {
  min-height: 40px;
}

.tipo-select :deep(.v-field__input),
.tipo-select :deep(.v-select__selection) {
  font-weight: 500;
}

.tipo-select :deep(.v-field__append-inner .v-icon) {
  color: #1976d2;
}

/* ===== TABELA PRINCIPAL ===== */
.table-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
}

.data-table-custom {
  font-size: 0.95rem;
}

.data-table-custom :deep(.v-data-table__wrapper) {
  overflow-x: auto;
}

/* Headers da tabela */
.data-table-custom :deep(.v-data-table-header th) {
  background-color: #37474f !important;
  color: white !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px !important;
}

.data-table-custom :deep(.v-data-table-header th .v-data-table-header__content) {
  color: white !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.95rem !important;
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
  transition: background-color 0.2s ease;
}

.table-row-hover:nth-child(even) {
  background-color: #fafafa;
}

.table-row-hover:nth-child(odd) {
  background-color: white;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background-color: #e8f5e8 !important;
  transform: scale(1.002);
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
}

.table-cell {
  padding: 12px 16px;
  vertical-align: middle;
  border-bottom: 1px solid #e0e0e0;
}

/* ===== TOOLTIP DE OPERADORES ===== */
.operadores-chip {
  cursor: help;
  transition: all 0.2s ease;
}

.operadores-chip:hover {
  transform: scale(1.05);
}

.operadores-tooltip {
  background-color: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  max-width: 250px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.operador-item {
  margin-bottom: 4px;
  color: #f5f5f5;
  font-size: 0.875rem;
}

.operador-item:last-child {
  margin-bottom: 0;
}

/* ===== TIPOS DE VALORES NAS CÉLULAS ===== */
.numeric-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1976d2;
  text-align: right;
}

.id-value {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #757575;
  font-size: 0.9em;
}

.date-value {
  font-weight: 500;
  color: #388e3c;
}

.time-value {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  color: #ff9800;
}

.maquinario-value {
  font-weight: 500;
  color: #9c27b0;
}

.motivo-value {
  font-weight: 500;
  color: #d32f2f;
}

.text-value {
  color: #424242;
}

/* ===== ESTADOS ESPECIAIS DA TABELA ===== */
.no-data-container {
  padding: 4rem 2rem;
  text-align: center;
}

.loading-container {
  padding: 4rem 2rem;
  text-align: center;
}

/* ===== MODAL DE CONFIGURAÇÃO DE COLUNAS ===== */
.column-config-modal {
  border-radius: 16px;
  overflow: hidden;
  max-height: 100vh;
}

/* Header do Modal */
.modal-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%);
  background-size: 20px 20px;
}

.modal-title {
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
  z-index: 1;
  position: relative;
}

.close-btn {
  color: white !important;
  z-index: 1;
  position: relative;
}

/* Conteúdo do Modal */
.config-content {
  background-color: #fafafa;
}

.section-header {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  color: #37474f;
  margin-bottom: 1rem;
}

.section-stats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
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
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  cursor: grab;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.column-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  transition: background-color 0.3s ease;
}

.column-item.column-visible::before {
  background-color: #4caf50;
}

.column-item.column-hidden::before {
  background-color: #f44336;
}

.column-item:hover {
  border-color: #1976d2;
  box-shadow: 0px 4px 16px rgba(25, 118, 210, 0.2);
}

.column-item.column-visible {
  border-color: #4caf50;
  background-color: #f1f8e9;
}

.column-item.column-hidden {
  border-color: #f44336;
  background-color: #fce4ec;
  opacity: 0.7;
}

/* Conteúdo dos itens da coluna */
.column-item-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.drag-handle {
  cursor: grab;
  color: #757575;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #424242;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:active .v-icon {
  transform: scale(1.1);
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
  font-size: 1rem;
}

.column-key {
  color: #757575;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

.column-status {
  flex-shrink: 0;
}

.status-chip {
  font-weight: 600;
  font-size: 0.75rem;
}

.order-indicator {
  background-color: #4caf50;
  color: white;
  font-weight: bold;
  min-width: 24px;
}

/* ===== ANIMAÇÕES E TRANSIÇÕES ===== */
.column-item-enter-active,
.column-item-leave-active {
  transition: all 0.3s ease;
}

.column-item-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.column-item-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
  transform: rotate(2deg);
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.column-item:focus-within {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

.v-btn:focus-visible {
  outline: 2px solid #1976d2;
  outline-offset: 2px;
}

/* Container com scroll lateral */
.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

/* Células customizadas */
.cell-content {
  display: flex;
  align-items: center;
  min-height: 32px;
}

/* Chips para múltiplos valores */
.v-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Estados da tabela */
.data-table-custom :deep(tbody tr:hover) {
  background-color: #e3f2fd !important;
}

.data-table-custom :deep(.v-data-table__th) {
  background-color: #37474f !important;
  color: white !important;
}

/* Bordas e separadores */
.border-b {
  border-bottom: 1px solid #e0e0e0;
}

.border-t {
  border-top: 1px solid #e0e0e0;
}

/* ===== RESPONSIVIDADE ===== */
@media (max-width: 768px) {
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
  
  .data-table-custom {
    font-size: 0.85rem;
  }
  
  .table-cell {
    padding: 8px 12px;
  }
  
  .column-item-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .drag-handle {
    order: -1;
    align-self: flex-end;
  }
  
  .column-status {
    align-self: flex-end;
  }
  
  .section-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .section-actions .v-btn {
    width: 100%;
  }
  
  .modal-title {
    font-size: 1.1rem;
  }
  
  .column-config-modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .tipo-select {
    min-width: 150px !important;
  }
}

@media (max-width: 480px) {
  .table-toolbar {
    padding: 12px !important;
  }
  
  .table-title {
    font-size: 1rem;
  }
  
  .cell-content {
    font-size: 0.8rem;
  }
  
  .v-chip {
    font-size: 0.7rem !important;
  }
  
  .column-item {
    padding: 12px;
  }
  
  .section-stats {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* ===== MELHORIAS DE PERFORMANCE ===== */
.table-container {
  contain: layout style;
}

.column-item {
  contain: layout style;
}

.data-table-custom :deep(.v-data-table__wrapper) {
  contain: layout style;
}

/* ===== TEMA ESCURO (caso necessário) ===== */
@media (prefers-color-scheme: dark) {
  .table-header {
    background: linear-gradient(135deg, #263238 0%, #37474f 100%);
    border-color: #424242;
  }
  
  .column-item {
    background: #303030;
    border-color: #424242;
    color: white;
  }
  
  .column-item.column-visible {
    background-color: #1b5e20;
    border-color: #4caf50;
  }
  
  .column-item.column-hidden {
    background-color: #b71c1c;
    border-color: #f44336;
  }
  
  .column-title {
    color: white;
  }
  
  .column-key {
    color: #bdbdbd;
  }
}
</style>
