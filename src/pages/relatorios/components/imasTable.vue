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
        :items-per-page="10"
        :items-per-page-options="[10, 15, 25, 50, 100]"
        :search="buscaLocal"
        show-current-page
        fixed-header
        height="600px"
      >
        <template v-slot:top>
          <div class="table-toolbar pa-3">
            <div class="d-flex justify-space-between align-center">
              <h3 class="table-title">Dados do Relatório</h3>
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
              <span v-if="isNumericField(header.key)" class="numeric-value">
                {{ formatNumericValue(item[header.key]) }}
              </span>
              <span v-else-if="isDateField(header.key)" class="date-value">
                {{ formatDateValue(item[header.key]) }}
              </span>
              <span v-else-if="isEquipField(header.key)" class="">
                {{ formatEquipamento(item[header.key]) }}
              </span>
              <span v-else class="text-value">
                {{ item[header.key] }}
              </span>
            </td>
          </tr>
        </template>

        <template v-slot:bottom>
          <div class="table-footer pa-3">
            <v-row align="center" justify="space-between">
              <v-col cols="auto">
                <span class="text-caption text-grey">
                  Mostrando {{ Math.min(filteredItems.length, 10) }} de {{ filteredItems.length }} registros
                  <span v-if="buscaLocal"> (filtrados de {{ dados.length }} total)</span>
                </span>
              </v-col>
            </v-row>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { cadAux } from '../../../stores/Movimentos/getCadAux';

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
  }
});

// Emits
const emit = defineEmits(['atualizar', 'update:busca']);


// Data local
const buscaLocal = ref(props.busca);
const equipOptions = ref('');

const cadAuxStore = cadAux();

// Watch para sincronizar busca
watch(() => props.busca, (newVal) => {
  buscaLocal.value = newVal;
});

async function loadCadAux() {
  try {
    const response = await cadAuxStore.cadAux("APT");
    equipOptions.value = response.map(item => ({
      label: item.cadAuxDescr,
      value: item.cadAuxCod
    }));
  } catch (error) {
    console.error('Erro ao carregar cadAux equip: ', error);
  }
}

onMounted(()=> {
  loadCadAux();
})

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

const equipMap = computed(() => {
  const map = {};
  equipOptions.value.forEach(item => {
    map[item.value] = item.label;
  });
  return map;
})

// Funções auxiliares para formatação
const isNumericField = (fieldKey) => {
  const numericFields = ['Quant', 'quant', 'quantidade', 'valor', 'peso'];
  return numericFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const isDateField = (fieldKey) => {
  const dateFields = ['Data', 'data', 'date'];
  return dateFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const isEquipField = (fieldKey) => {
  console.log('Verificando campo:', fieldKey);
  const equipFields = ['Equipto', 'equipamento', 'Equip'];
  return equipFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const formatNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatEquipamento = (value) => {
  if (!value) return '-';
  return equipMap.value[value] || value;
}

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
    
    link.setAttribute('download', `Relatorio_Imas_${dataFormatada}_${horaFormatada}.xls`);
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

/* Footer da tabela */
.table-footer {
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
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
</style>
