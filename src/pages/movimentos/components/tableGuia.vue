<template>
  <!-- Seção da Tabela -->
  <div v-if="mostrarTabela" class="table-section">
    <!-- Header da tabela com controles -->
    <div class="table-header elevation-1 pa-4 mb-4 rounded-lg">
      <v-row align="center" justify="space-between">
        <v-col cols="12" md="6" class="d-flex align-center ga-3">
          <v-btn 
            color="primary" 
            @click="$emit('atualizar')"
            :loading="loading"
            prepend-icon="mdi-refresh"
            variant="elevated"
            size="default"
          >
            Atualizar
          </v-btn>
          
          <v-chip 
            v-if="dados.length > 0"
            color="success"
            variant="tonal"
            prepend-icon="mdi-table"
          >
            {{ dados.length }} registros
          </v-chip>
          
          <v-chip 
            v-if="filteredItems.length !== dados.length && buscaLocal"
            color="info"
            variant="tonal"
            prepend-icon="mdi-filter"
            class="ml-2"
          >
            {{ filteredItems.length }} filtrados
          </v-chip>

          <v-chip 
            v-if="dados.length > 10"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-view-list"
            class="ml-2"
          >
            {{ itemsPerPage === -1 ? 'Todos' : itemsPerPage }} por página
          </v-chip>
        </v-col>
        
        <v-col cols="12" md="6" class="d-flex justify-end">
          <v-text-field
            v-model="buscaLocal"
            label="Buscar na tabela..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            style="max-width: 350px;"
            class="search-field"
            @input="$emit('update:busca', buscaLocal)"
          />
        </v-col>
      </v-row>
    </div>

    <!-- Tabela principal -->
    <v-card class="table-card" elevation="3">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        class="data-table-custom"
        :items-per-page="itemsPerPage"
        :items-per-page-options="[
          { value: 10, title: '10' },
          { value: 15, title: '15' },
          { value: 25, title: '25' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
          { value: -1, title: 'Todos' }
        ]"
        :search="buscaLocal"
        show-current-page
        fixed-header
        height="600px"
        :page="currentPage"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
      >
        <template v-slot:top>
          <div class="table-toolbar pa-3">
            <div class="d-flex justify-space-between align-center">
              <h3 class="table-title">Guia de Entrada - Dados</h3>
              <div class="d-flex ga-2">
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

        <!-- Template para células com valores numéricos -->
        <template v-slot:item="{ item }">
          <tr class="table-row-hover">
            <td v-for="header in headers" :key="header.key" class="table-cell text-left">
              <span 
                :class="{
                  'numeric-value': isNumericField(header.key),
                  'date-value': isDateField(header.key),
                  'text-value': !isNumericField(header.key) && !isDateField(header.key)
                }"
              >
                {{ formatCellValue(item[header.key], header.key) }}
              </span>
            </td>
          </tr>
        </template>
      </v-data-table>
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
  busca: {
    type: String,
    default: ''
  },
  labelMapCompleto: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['atualizar', 'update:busca']);

// Data local
const buscaLocal = ref(props.busca);

// Estados da paginação
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Estados do modal de configuração de colunas
const modalColunas = ref(false);
const salvandoColunas = ref(false);
const configColunas = ref([]);
const itemArrastando = ref(null);

// Store da API
const setColumnStore = setColumn();

// Watch para sincronizar busca
watch(() => props.busca, (newVal) => {
  buscaLocal.value = newVal;
  currentPage.value = 1; // Reset página quando busca muda
});

// Watch para resetar página quando dados mudam
watch(() => props.dados, () => {
  currentPage.value = 1; // Reset página quando dados mudam
});

// Watch para monitorar mudanças na paginação
watch(itemsPerPage, (newValue) => {
});

watch(currentPage, (newValue) => {
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

// Função para atualizar configuração das colunas
const atualizarConfigColunas = (headers, labelMapCompleto = null) => {
  
  // Lista completa de todos os campos possíveis da API Z1AJUSTIF
  const todosOsCamposPossiveis = [
    { key: 'ticket', title: 'Ticket' },
    { key: 'placa1', title: 'Placa 1' },
    { key: 'placa2', title: 'Placa 2' },
    { key: 'placa3', title: 'Placa 3' },
    { key: 'dataEnt', title: 'Data Entrada' },
    { key: 'horaEnt', title: 'Hora Entrada' },
    { key: 'horaSai', title: 'Hora Saída' },
    { key: 'embalagem', title: 'Embalagem' },
    { key: 'moega', title: 'Moega' },
    { key: 'cicloD', title: 'Ciclo D' },
    { key: 'padrCi', title: 'Padrão CI' },
    { key: 'txPerf', title: 'Taxa Performance' },
    { key: 'codJus', title: 'Código Justificativa' }
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

// Computed para filtrar dados baseado na busca
const filteredItems = computed(() => {
  if (!buscaLocal.value) return props.dados;
  
  const termoBusca = buscaLocal.value.toLowerCase();
  return props.dados.filter(item => {
    return Object.values(item).some(valor => 
      String(valor).toLowerCase().includes(termoBusca)
    );
  });
});

// Computed para colunas visíveis na ordem configurada
const colunasVisiveis = computed(() => {
  return configColunas.value.filter(coluna => coluna.visivel);
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
};

const onItemsPerPageChange = (itemsPerPageValue) => {
  itemsPerPage.value = itemsPerPageValue;
  currentPage.value = 1; // Reset para primeira página
};

// Funções auxiliares para formatação
const isNumericField = (fieldKey) => {
  const numericFields = ['peso', 'quant', 'quantidade', 'valor', 'val', 'num', 'qtd', 'tx'];
  return numericFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const isDateField = (fieldKey) => {
  const dateFields = ['data', 'date'];
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

const formatCellValue = (value, fieldKey) => {
  if (isNumericField(fieldKey)) {
    return formatNumericValue(value);
  } else if (isDateField(fieldKey)) {
    return formatDateValue(value);
  }
  return value || '-';
};

// Função para exportar dados
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
        let value = item[header.key] || '';
        let cellClass = '';
        
        // Aplica formatação baseada no tipo de campo
        if (isNumericField(header.key)) {
          cellClass = 'numeric';
          value = formatNumericValue(value);
        } else if (isDateField(header.key)) {
          cellClass = 'date';
          value = formatDateValue(value);
        }
        
        // Escapa caracteres especiais para HTML
        value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
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
    
    console.log('Arquivo Excel exportado com sucesso!');
  } catch (error) {
    console.error('Erro ao exportar dados para Excel:', error);
    alert('Erro ao exportar dados para Excel');
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
  // Define colunas essenciais como padrão baseado nos nomes comuns
  const colunasEssenciais = ['ticket', 'placa1', 'placa2', 'dataent', 'horaent', 'horasai', 'embalagem', 'moega', 'txperf', 'codjus'];
  
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
  const colunasCriticas = ['ticket', 'placa1', 'dataent', 'horaent', 'embalagem', 'moega'];
  
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
      grid: 'Z1AJUS',
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

/* Campo de busca */
.search-field :deep(.v-field__outline) {
  border-color: #1976d2;
}

.search-field :deep(.v-field--focused .v-field__outline) {
  border-color: #1976d2;
  border-width: 2px;
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
  
  .search-field {
    max-width: 100% !important;
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
