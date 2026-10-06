<template>
  <!-- Seção da Tabela -->
  <div v-if="mostrarTabela" class="table-section">
    <!-- Tabela principal -->
    <v-card class="table-card" elevation="3">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        class="data-table-custom"
        hide-default-footer
        :items-per-page="-1"
        :search="buscaLocal"
        fixed-header
        height="350px"
      >
        <template v-slot:top>
          <div class="table-toolbar pa-3">
            <div class="d-flex justify-space-between align-center ga-3">
              <h3 class="table-title">Dados do Relatório</h3>
              <div class="d-flex align-center ga-3">
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
                {{ formatNumericValue(getItemValue(item, header.key)) }}
              </span>
              <span v-else-if="isDateField(header.key)" class="date-value">
                {{ formatDateValue(getItemValue(item, header.key)) }}
              </span>
              <span v-else-if="isSetorField(header.key)" class="text-value">
                {{ formatSetor(item) }}
              </span>
              <span v-else-if="isEquipField(header.key)" class="">
                {{ formatEquipamento(getItemValue(item, header.key)) }}
              </span>
              <span v-else class="text-value">
                {{ getItemValue(item, header.key) }}
              </span>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { cadAux } from '../../../stores/Movimentos/getCadAux';
import { cadUsrMaq } from '../../../stores/Consultas/getCadUsrMaq';

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
const equipOptions = ref([]);
const setorOptions = ref([]);

const cadAuxStore = cadAux();
const cadUsrMaqStore = cadUsrMaq();

// Watch para sincronizar busca
watch(() => props.busca, (newVal) => {
  buscaLocal.value = newVal;
});

async function loadCadAux() {
  try {
    const response = await cadAuxStore.cadAux("APT");
    const equipamentos = Array.isArray(response) ? response : [];
    equipOptions.value = equipamentos.map(item => ({
      label: getObjectValue(item, ['cadAuxDescr', 'CadAuxDescr', 'descr', 'descricao']),
      value: getObjectValue(item, ['cadAuxCod', 'CadAuxCod', 'cod', 'codigo'])
    }));
    console.log('CadAux carregado:', equipOptions.value);
  } catch (error) {
    console.error('Erro ao carregar cadAux equip: ', error);
  }
}

async function loadSetoresEquipamentos() {
  try {
    const response = await cadUsrMaqStore.getCadUsrMaq('RICARDO');
    const equipamentos = Array.isArray(response) ? response : [];
    setorOptions.value = equipamentos.map(item => ({
      label: getObjectValue(item, ['cadAuxDescr', 'CadAuxDescr', 'descr', 'descricao']),
      value: getObjectValue(item, ['cadAuxCod', 'CadAuxCod', 'cod', 'codigo']),
      setor: getObjectValue(item, ['cadAuxCodAlt', 'CadAuxCodAlt', 'codAlt', 'codigoAlt', 'setor'])
    }));
    console.log('Setores por equipamento carregados:', setorOptions.value);
  } catch (error) {
    console.error('Erro ao carregar setores dos equipamentos: ', error);
    setorOptions.value = [];
  }
}

onMounted(async ()=> {
  await Promise.all([loadCadAux(), loadSetoresEquipamentos()]);
})

// Computed para filtrar dados baseado na busca com ordenação cronológica
const filteredItems = computed(() => {
  // Primeiro aplica o filtro de busca
  let dadosFiltrados = props.dados;
  
  if (buscaLocal.value) {
    const termoBusca = buscaLocal.value.toLowerCase();
    dadosFiltrados = props.dados.filter(item => {
      const setor = formatSetor(item);
      return Object.values(item).some(valor => 
        String(valor).toLowerCase().includes(termoBusca)
      ) || setor.toLowerCase().includes(termoBusca);
    });
  }
  
  // Depois ordena por data e hora cronologicamente
  return [...dadosFiltrados].sort((a, b) => {
    // Busca campos de data (procura por qualquer campo que contenha "data")
    const campoData = Object.keys(a).find(key => key.toLowerCase().includes('data'));
    
    if (!campoData) return 0; // Se não há campo de data, mantém ordem original
    
    const dataA = a[campoData] || '';
    const dataB = b[campoData] || '';
    
    // Compara as datas (formato YYYYMMDD permite comparação direta como string)
    if (dataA !== dataB) {
      return dataA.toString().localeCompare(dataB.toString());
    }
    
    // Se as datas são iguais, ordena por hora se existir
    const campoHora = Object.keys(a).find(key => key.toLowerCase().includes('hora'));
    
    if (campoHora) {
      const horaA = a[campoHora] || '00:00';
      const horaB = b[campoHora] || '00:00';
      return horaA.toString().localeCompare(horaB.toString());
    }
    
    return 0;
  });
});

const equipMap = computed(() => {
  const map = {};
  equipOptions.value.forEach(item => {
    addEquipmentMapValue(map, item.value, item.label);
  });
  return map;
})

const setorMap = computed(() => {
  const map = {};
  setorOptions.value.forEach(item => {
    addEquipmentMapValue(map, item.value, item.setor);
    addEquipmentMapValue(map, item.label, item.setor);
  });
  return map;
})

const getObjectValue = (item, keys) => {
  const itemKeys = Object.keys(item || {});
  const key = keys.find(possibleKey => {
    const exactKey = itemKeys.find(itemKey => itemKey.toLowerCase() === possibleKey.toLowerCase());
    return exactKey && item[exactKey] !== undefined && item[exactKey] !== null;
  });

  if (!key) return '';

  const actualKey = itemKeys.find(itemKey => itemKey.toLowerCase() === key.toLowerCase());
  return actualKey ? item[actualKey] : '';
};

const addEquipmentMapValue = (map, key, value) => {
  if (!key || !value) return;

  const normalized = normalizeCode(key);
  map[normalized] = value;

  const withoutLeadingZeros = normalized.replace(/^0+(\d)/, '$1');
  map[withoutLeadingZeros] = value;

  const onlyNumbers = normalized.replace(/\D/g, '');
  if (onlyNumbers) {
    map[onlyNumbers] = value;
    map[onlyNumbers.replace(/^0+(\d)/, '$1')] = value;
  }
};

const getRawItem = (item) => item?.raw || item?.columns || item;

const getItemValue = (item, key) => {
  const rawItem = getRawItem(item);
  return rawItem ? rawItem[key] : '';
};

const normalizeCode = (value) => String(value ?? '').trim().toUpperCase();

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
  const equipFields = ['Equipto', 'equipamento', 'Equip'];
  return equipFields.some(field => fieldKey.toLowerCase().includes(field.toLowerCase()));
};

const isSetorField = (fieldKey) => {
  return fieldKey === '__setor' || fieldKey.toLowerCase() === 'setor';
};

const formatNumericValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // Converte kg para gramas (multiplica por 1000)
  const gramas = num * 1000;
  
  // Retorna apenas o número sem unidades
  return Math.round(gramas).toLocaleString('pt-BR');
};

const formatEquipamento = (value) => {
  if (!value) return '-';
  console.log('Formatando equipamento:', value, 'Mapa:', equipMap.value);
  return equipMap.value[normalizeCode(value)] || value;
}

const getEquipamentoValue = (item) => {
  const rawItem = getRawItem(item);
  if (!rawItem) return null;

  const equipKey = Object.keys(rawItem).find(key => isEquipField(key));
  return equipKey ? rawItem[equipKey] : null;
};

const getSetorByItem = (item) => {
  const equipamento = getEquipamentoValue(item);
  return equipamento ? setorMap.value[normalizeCode(equipamento)] : null;
};

const formatSetorValue = (value) => {
  if (!value) return '-';

  const setores = {
    Producao: 'Produção',
    Expedicao: 'Expedição',
    Recebimento: 'Recebimento',
    Preparo: 'Preparo'
  };

  return setores[value] || value;
};

const formatSetor = (item) => {
  return formatSetorValue(getSetorByItem(item));
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
        } else if (isSetorField(header.key)) {
          value = formatSetor(item);
        } else if (isEquipField(header.key)) {
          value = formatEquipamento(value);
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

/* Controles de paginação */
.pagination-btn {
  min-width: 36px !important;
  width: 36px;
  height: 36px;
}

.pagination-btn:hover {
  background-color: rgba(25, 118, 210, 0.1);
  color: #1976d2;
}

.pagination-btn:disabled {
  opacity: 0.4;
}

/* Seletor de itens por página */
.items-per-page-select :deep(.v-field__input) {
  min-height: 32px;
}

.items-per-page-select :deep(.v-field__outline) {
  border-color: #e0e0e0;
}

.items-per-page-select :deep(.v-field--focused .v-field__outline) {
  border-color: #1976d2;
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
