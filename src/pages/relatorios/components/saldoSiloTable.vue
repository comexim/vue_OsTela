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
        :items-per-page="-1"
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
      >
        <template v-slot:top>
          <div class="table-toolbar pa-3">
            <div class="d-flex justify-space-between align-center">
              <h3 class="table-title">Saldo Silo WMS x SUP - Dados</h3>
              <div class="d-flex ga-2">
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-printer"
                  @click="imprimirTabela"
                  :disabled="dados.length === 0"
                >
                  Imprimir
                </v-btn>
                <v-btn
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-microsoft-excel"
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
            <p class="text-grey">Clique em "Carregar Dados" para buscar as informações.</p>
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

        <!-- Template para células com valores formatados -->
        <template v-slot:item="{ item }">
          <tr class="table-row-hover">
            <td v-for="header in headers" :key="header.key" class="table-cell text-left">
              <span 
                :class="{
                  'numeric-value': isNumericField(header.key) && header.key !== 'difer',
                  'date-value': isDateField(header.key),
                  'difference-value': header.key === 'difer',
                  'text-value': !isNumericField(header.key) && !isDateField(header.key) && header.key !== 'difer'
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
  }
});

// Emits
const emit = defineEmits(['atualizar', 'update:busca']);

// Data local
const buscaLocal = ref(props.busca);

// Watch para sincronizar busca
watch(() => props.busca, (newVal) => {
  buscaLocal.value = newVal;
});

// Função auxiliar para ordenar silos corretamente
const ordenarSilos = (dados) => {
  return [...dados].sort((a, b) => {
    const codigoA = String(a.codigo || '');
    const codigoB = String(b.codigo || '');
    
    // Extrai número e letra do código (ex: "43A" -> numero: 43, letra: "A")
    const matchA = codigoA.match(/^(\d+)([A-Z]?)$/);
    const matchB = codigoB.match(/^(\d+)([A-Z]?)$/);
    
    if (matchA && matchB) {
      const numA = parseInt(matchA[1]);
      const numB = parseInt(matchB[1]);
      const letraA = matchA[2] || '';
      const letraB = matchB[2] || '';
      
      // Primeiro ordena por número
      if (numA !== numB) {
        return numA - numB;
      }
      
      // Se números iguais, ordena por letra
      return letraA.localeCompare(letraB);
    }
    
    // Fallback para ordenação normal
    return codigoA.localeCompare(codigoB);
  });
};

// Computed para filtrar e ordenar dados
const filteredItems = computed(() => {
  let resultado = props.dados;
  
  // Aplica filtro de busca
  if (buscaLocal.value) {
    const termoBusca = buscaLocal.value.toLowerCase();
    resultado = resultado.filter(item => {
      return Object.values(item).some(valor => 
        String(valor).toLowerCase().includes(termoBusca)
      );
    });
  }
  
  // Ordena os silos corretamente
  return ordenarSilos(resultado);
});

// Funções auxiliares para formatação
const isNumericField = (fieldKey) => {
  const numericFields = ['capacidade', 'saldowms', 'sup', 'difer', 'saldo', 'diferenca', 'sacas', 'peso', 'quantidade', 'quant', 'valor', 'wmssacas', 'supsacas'];
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
    
    link.setAttribute('download', `Saldo_Silo_WMS_SUP_${dataFormatada}_${horaFormatada}.xls`);
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

// Função para imprimir a tabela
const imprimirTabela = () => {
  if (props.dados.length === 0) {
    alert('Não há dados para imprimir');
    return;
  }

  const conteudoImpressao = gerarConteudoHTML();
  const janelaImpressao = window.open('', '_blank');
  janelaImpressao.document.write(conteudoImpressao);
  janelaImpressao.document.close();
  janelaImpressao.focus();
  janelaImpressao.print();
};

// Função auxiliar para gerar conteúdo HTML para impressão
const gerarConteudoHTML = () => {
  const agora = new Date();
  const dataHora = agora.toLocaleString('pt-BR');
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Saldo Silo WMS x SUP</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .header h1 {
          margin: 0;
          color: #333;
        }
        .header p {
          margin: 5px 0;
          color: #666;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #37474f;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #333;
        }
        td {
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Saldo Silo WMS x SUP - Relatório</h1>
        <p>Gerado em: ${dataHora}</p>
        <p>Total de registros: ${props.dados.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
  `;

  // Adiciona cabeçalhos
  props.headers.forEach(header => {
    html += `<th>${header.title}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  // Adiciona dados
  props.dados.forEach(item => {
    html += '<tr>';
    props.headers.forEach(header => {
      let value = item[header.key] || '';
      
      // Aplica formatação
      if (isNumericField(header.key)) {
        value = formatNumericValue(value);
      } else if (isDateField(header.key)) {
        value = formatDateValue(value);
      }
      
      html += `<td>${value}</td>`;
    });
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
      
      <div class="footer">
        <p>Relatório gerado pelo sistema OSTela</p>
      </div>
    </body>
    </html>
  `;

  return html;
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

.difference-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #d32f2f;
  text-align: left !important;
  display: block;
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
</style>
