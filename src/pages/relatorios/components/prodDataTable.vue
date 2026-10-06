<template>
  <!-- Seção da Tabela -->
  <div v-if="mostrarTabela" class="table-section">
    <!-- Tabela principal customizada -->
    <v-card class="table-card" elevation="3">
      <!-- Toolbar -->
      <div class="table-toolbar pa-3">
        <div class="d-flex justify-space-between align-center ga-3">
          <h3 class="table-title">Dados do Relatório</h3>
          <div class="d-flex align-center ga-2">
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
            <v-btn
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="mdi-microsoft-excel"
              @click="exportarDados"
              v-if="dados.length > 0"
            >
              Exportar Excel
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Tabela Vuetify com scroll -->
      <div class="table-container">
        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          :search="buscaLocal"
          class="data-table-custom elevation-1"
          item-value="id"
          v-model:expanded="expanded"
          show-expand
          density="comfortable"
          height="350px"
          fixed-header
          hide-default-footer
          :items-per-page="-1"
        >
        <!-- Slot para linha expandida com detalhes -->
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="pa-0">
              <v-card flat class="ma-2">
                <v-card-title class="text-subtitle-1 bg-grey-lighten-3">
                  Detalhes do Lote {{ item.LOTE }}
                </v-card-title>
                <v-card-text class="pa-4">
                  <v-data-table
                    :headers="detalhesHeaders"
                    :items="item._detalhes"
                    density="compact"
                    class="elevation-0"
                    hide-default-footer
                    :items-per-page="-1"
                  >
                  </v-data-table>
                </v-card-text>
              </v-card>
            </td>
          </tr>
        </template>

        <!-- Slot para estado vazio -->
        <template v-slot:no-data>
          <div class="text-center pa-8">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
            <h3 class="text-grey-darken-1 mb-2">Nenhum dado encontrado</h3>
            <p class="text-grey">Configure os filtros e clique em "Filtrar" para carregar os dados.</p>
          </div>
        </template>

        <!-- Slot para loading -->
        <template v-slot:loading>
          <div class="text-center pa-8">
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
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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
  alturaTabela: {
    type: Number,
    default: 600
  }
});

// Emits
const emit = defineEmits(['update:busca']);

// Data local
const buscaLocal = ref(props.busca);
const expanded = ref([]);

// Watch para sincronizar busca
watch(() => props.busca, (newVal) => {
  buscaLocal.value = newVal;
});

// Headers para tabela de detalhes
const detalhesHeaders = ref([
  { title: 'Data', key: 'DATA', align: 'center', sortable: true },
  { title: 'Hora', key: 'HORA', align: 'center', sortable: true },
  { title: 'Setor', key: 'SETOR', align: 'center', sortable: true },
  { title: 'Peso', key: 'PESO', align: 'center', sortable: true },
  { title: 'Sacas', key: 'SACAS', align: 'center', sortable: true },
  { title: 'Tag', key: 'TAG', align: 'center', sortable: true },
  { title: 'Posição atual', key: 'POSICAO', align: 'center', sortable: true }
]);

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
    props.headers.forEach(header => {
      excelContent += `<th>${header.title}</th>`;
    });

    excelContent += `
            </tr>
          </thead>
          <tbody>
    `;

    // Adiciona dados com seus detalhes
    props.dados.forEach((item, index) => {
      // Linha do cabeçalho principal
      excelContent += '<tr style="background-color: #e0e0e0; font-weight: bold;">';
      props.headers.forEach(header => {
        let value = item[header.key] || '';
        
        // Escapa caracteres especiais para HTML
        value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        excelContent += `<td>${value}</td>`;
      });
      excelContent += '</tr>';

      // Se existem detalhes, adiciona a seção de detalhes
      if (item._detalhes && item._detalhes.length > 0) {
        // Linha de título dos detalhes
        excelContent += `<tr class="detalhes-header">`;
        excelContent += `<td colspan="${props.headers.length}" style="background-color: #78909c; color: white; font-weight: bold; padding: 8px;">DETALHES DO LOTE ${item.LOTE}</td>`;
        excelContent += `</tr>`;

        // Cabeçalhos dos detalhes
        excelContent += '<tr class="detalhes-header">';
        detalhesHeaders.value.forEach(header => {
          excelContent += `<th style="background-color: #90a4ae; color: white;">${header.title}</th>`;
        });
        // Preenche colunas vazias restantes se necessário
        const colunasRestantes = props.headers.length - detalhesHeaders.value.length;
        for (let i = 0; i < colunasRestantes; i++) {
          excelContent += `<th style="background-color: #90a4ae;"></th>`;
        }
        excelContent += '</tr>';

        // Linhas de detalhes
        item._detalhes.forEach(detalhe => {
          excelContent += '<tr class="detalhes-row">';
          detalhesHeaders.value.forEach(header => {
            let value = detalhe[header.key] || '';
            value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            excelContent += `<td>${value}</td>`;
          });
          // Preenche colunas vazias restantes
          for (let i = 0; i < colunasRestantes; i++) {
            excelContent += `<td></td>`;
          }
          excelContent += '</tr>';
        });
      }

      // Linha separadora entre registros (exceto no último)
      if (index < props.dados.length - 1) {
        excelContent += `<tr class="separador"><td colspan="${props.headers.length}"></td></tr>`;
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
    
    link.setAttribute('download', `Relatorio_Producao_Data_${dataFormatada}_${horaFormatada}.xls`);
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

/* Container com scroll lateral */
.table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.table-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.12);
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

/* Estilo da tabela Vuetify */
.data-table-custom :deep(thead) {
  background-color: #37474f !important;
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
}

.data-table-custom :deep(thead th) {
  color: white !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: #37474f !important;
  padding: 16px !important;
  font-size: 0.95rem !important;
  border-bottom: 2px solid #263238 !important;
}

.data-table-custom :deep(.v-data-table__th) {
  background-color: #37474f !important;
  color: white !important;
}

.data-table-custom :deep(tbody tr:hover) {
  background-color: #e3f2fd !important;
}

.numeric-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1976d2;
}

.date-value {
  font-weight: 500;
  color: #388e3c;
}

.text-value {
  color: #424242;
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
</style>
