<template>
  <v-dialog v-model="dialogVisible" max-width="1200px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-primary text-white d-flex align-center sticky-header">
        <h4>Imprimir Ordem de Serviço</h4>
        <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="fecharModal" size="small">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <!-- Botão para descer ao rodapé do relatório (não aparece na impressão) -->
          <v-btn
            class="ml-2 no-print"
            icon
            variant="text"
            size="small"
            title="Ir para o rodapé"
            @click="scrollToFooter"
          >
            <v-icon>mdi-arrow-down</v-icon>
          </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Área de visualização da impressão -->
        <div ref="printArea" class="print-area">
          <!-- Cabeçalho do relatório -->
          <div class="report-header">
              <h2 class="text-center mb-4">
                Relatório da Ordem de Serviço - {{ numeroOrdem }}
              </h2>
            
            <!-- Linha de informações principais -->
            <div class="info-line mb-4">
              <span><strong>ORDEM:</strong> {{ dadosOrdem.opTck || '-' }}</span>
              <span><strong>DATA:</strong> {{ formatarData(dadosOrdem.osdata) }}</span>
              <span><strong>HORA:</strong> {{ formatarHora(dadosOrdem.oshora) }}</span>
              <span><strong>BLOCO:</strong> {{ dadosOrdem.osblocoSuger || '-' }}</span>
              <span><strong>PRIORIDADE:</strong> {{ dadosOrdem.osprioridade || '-' }}</span>
            </div>
          </div>

          <!-- Cabeçalho único da tabela (repetido apenas no início de cada página) -->
          <table class="print-table main-table-header">
            <thead class="table-header-main">
              <tr>
                <th>IT</th>
                <th>EMP</th>
                <th>LOTE</th>
                <th>TAG</th>
                <th>
                  <button
                    type="button"
                    class="origem-sort-button"
                    :class="{ 'origem-sort-button--active': ordenarPorOrigem }"
                    :aria-pressed="ordenarPorOrigem"
                    :title="ordenarPorOrigem
                      ? 'Remover ordenação por origem'
                      : 'Ordenar lotes pela menor origem'"
                    @click="ordenarPorOrigem = !ordenarPorOrigem"
                  >
                    ORIGEM
                    <v-icon size="14">
                      {{ ordenarPorOrigem ? 'mdi-arrow-up' : 'mdi-sort' }}
                    </v-icon>
                  </button>
                </th>
                <th>DESTINO</th>
                <th>DEP. EM</th>
                <th>OBSERVAÇÃO</th>
                <th>QTD.ORDEM</th>
                <th>ATENDIDA</th>
                <th>STATUS</th>
              </tr>
            </thead>
          </table>

          <!-- Tabelas separadas por lote (sem cabeçalho) -->
          <div v-for="grupo in itensAgrupadosPorLoteParaImpressao" :key="grupo.lote" class="lote-group">
            <table class="print-table lote-table">
              <tbody>
                <tr v-for="item in grupo.itens" :key="item.itOSItem">
                  <td>{{ item.itOSItem }}</td>
                  <td>{{ item.empiCod }}</td>
                  <td>{{ item.lote }}</td>
                  <td>{{ formatarTag(item.itOsTagBag) }}</td>
                  <td>{{ item.itOsOrigem }}</td>
                  <td>{{ item.itOsDestino }}</td>
                  <td>{{ item.itOSStatus === 'AT' ? item.itOsDestinoDepEm : '-' }}</td>
                  <td>{{ item.itOsObs || '-' }}</td>
                  <td>{{ formatarPeso(item.itOsPeso/59) }}</td>
                  <td>{{ item.itOSStatus === 'AT' ? formatarPeso(item.itOsPeso/59) : '0,00' }}</td>
                  <td>{{ item.itOSStatus }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Subtotal do lote -->
            <div class="subtotal-lote">
              <div class="subtotal-info">
                <span><strong>Subtotal do {{ grupo.lote }}:</strong></span>
                <span><strong>Itens:</strong> {{ grupo.totalItens }}</span>
                <span><strong>Quantidade:</strong> {{ formatarPeso(grupo.totalQuantidade/59) }} sacas</span>
                <span><strong>Atendida:</strong> {{ formatarPeso(grupo.totalAtendida/59) }} sacas</span>
              </div>
            </div>
          </div>

          <!-- Rodapé com totais -->
      <div class="report-footer mt-3" ref="reportFooter">
            <div class="totals-section">
              <div class="totals-items">
                <div class="total-item totals-title-inline">
                  <strong>Total Geral da Guia:</strong>
                </div>
                <div class="total-item">
                  <strong>Total de Itens:</strong> {{ totalItensParaImpressao }}
                </div>
                <div class="total-item">
                  <strong>Quantidade Total:</strong> {{ formatarPeso(totalQuantidadeParaImpressao) }} sacas
                </div>
                <div class="total-item">
                  <strong>Quantidade Atendida:</strong> {{ formatarPeso(totalAtendidaParaImpressao/59) }} sacas
                </div>
                <div class="total-item">
                  <strong>Quantidade Restante:</strong> {{ formatarPeso(totalQuantidadeParaImpressao - totalAtendidaParaImpressao/59) }} sacas
                </div>
              </div>
            </div>
            
            <div class="print-info mt-4">
              <small>Impresso em {{ dataImpressao }} às {{ horaImpressao }}</small>
            </div>
          </div>
        </div>

        <!-- Botões de ação (não aparecem na impressão) -->
        <div class="action-buttons no-print mt-4">
          <v-btn
            color="primary"
            variant="elevated"
            @click="visualizarImpressao"
            prepend-icon="mdi-eye"
            class="mr-2"
          >
            Visualizar
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            @click="imprimir"
            prepend-icon="mdi-printer"
            class="mr-2"
          >
            Imprimir
          </v-btn>
        </div>
      </v-card-text>

      <v-card-actions class="pa-3 no-print">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="elevated"
          @click="fecharModal"
          prepend-icon="mdi-close"
        >
          Fechar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

/* ========================================
   CAMADA DE CONFIGURAÇÃO E INTERFACE
======================================== */

// Props do componente
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  dadosCompletos: {
    type: Array,
    default: () => []
  },
  itemSelecionado: {
    type: Object,
    default: () => ({})
  }
});

// Eventos emitidos pelo componente
const emit = defineEmits(['update:modelValue']);

/* ========================================
   CAMADA DE ESTADO REATIVO
======================================== */

// Estados locais do componente
const dialogVisible = ref(props.modelValue);
const printArea = ref(null);
const reportFooter = ref(null);
const ordenarPorOrigem = ref(false);

// Watchers para sincronização de estado
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

/* ========================================
   CAMADA DE FORMATAÇÃO DE DADOS
======================================== */

/**
 * Formatar data do formato YYYYMMDD para DD/MM/YYYY
 * @param {string} value - Data no formato YYYYMMDD
 * @returns {string} Data formatada ou '-' se inválida
 */
const formatarData = (value) => {
  if (!value) return '-';
  if (typeof value === 'string' && value.length === 8 && /^\d{8}$/.test(value)) {
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return value;
};

/**
 * Formatar hora para o padrão HH:MM ou HH:MM:SS
 * @param {string} value - Hora em diversos formatos
 * @returns {string} Hora formatada ou '-' se inválida
 */
const formatarHora = (value) => {
  if (!value) return '-';
  if (typeof value === 'string' && value.includes(':')) {
    return value; // Já está formatado
  }
  if (typeof value === 'string' && value.length === 6 && /^\d{6}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    const second = value.substring(4, 6);
    return `${hour}:${minute}:${second}`;
  }
  if (typeof value === 'string' && value.length === 4 && /^\d{4}$/.test(value)) {
    const hour = value.substring(0, 2);
    const minute = value.substring(2, 4);
    return `${hour}:${minute}`;
  }
  return value;
};

/**
 * Formatar peso/valor numérico para o padrão brasileiro
 * @param {number|string} value - Valor numérico
 * @returns {string} Valor formatado com vírgula decimal
 */
const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Formatar tag para mostrar apenas os últimos 6 números
 * @param {string} value - Tag completa
 * @returns {string} Últimos 6 caracteres da tag ou '-' se vazia
 */
const formatarTag = (value) => {
  if (!value) return '-';
  return value.slice(-6);
};

/**
 * Converter data/hora do formato do sistema para objeto Date
 * @param {string} data - Data no formato YYYYMMDD
 * @param {string} hora - Hora em formato variado
 * @returns {Date|null} Objeto Date ou null se inválido
 */
const converterParaDate = (data, hora) => {
  if (!data || !hora) return null;
  
  // Formatar data (YYYYMMDD -> YYYY-MM-DD)
  let dataFormatada = data;
  if (typeof data === 'string' && data.length === 8) {
    const year = data.substring(0, 4);
    const month = data.substring(4, 6);
    const day = data.substring(6, 8);
    dataFormatada = `${year}-${month}-${day}`;
  }
  
  // Formatar hora (HH:MM ou HHMMSS -> HH:MM:SS)
  let horaFormatada = hora;
  if (typeof hora === 'string') {
    if (hora.includes(':')) {
      const parts = hora.split(':');
      if (parts.length === 2) {
        horaFormatada = `${parts[0]}:${parts[1]}:00`;
      } else {
        horaFormatada = hora;
      }
    } else if (hora.length === 6) {
      horaFormatada = `${hora.substring(0, 2)}:${hora.substring(2, 4)}:${hora.substring(4, 6)}`;
    } else if (hora.length === 4) {
      horaFormatada = `${hora.substring(0, 2)}:${hora.substring(2, 4)}:00`;
    }
  }
  
  return new Date(`${dataFormatada}T${horaFormatada}`);
};

/* ========================================
   CAMADA DE PROCESSAMENTO DE DADOS
======================================== */
/* ========================================
   CAMADA DE PROCESSAMENTO DE DADOS
======================================== */

/**
 * Dados gerais da ordem selecionada
 * Obtém informações básicas da OS como data, hora, prioridade, etc.
 */
const dadosOrdem = computed(() => {
  if (!props.itemSelecionado.osid || !props.dadosCompletos.length) {
    return {};
  }
  
  // Pega o primeiro item da ordem para obter dados gerais
  return props.dadosCompletos.find(item => item.osid === props.itemSelecionado.osid) || {};
});

/**
 * Número da ordem formatado
 * Retorna o número da OS ou 'N/A' se não encontrado
 */
const numeroOrdem = computed(() => {
  return dadosOrdem.value.opTck || props.itemSelecionado.opTck || 'N/A';
});

/**
 * Itens filtrados e ordenados da ordem selecionada
 * Filtra todos os itens com mesmo osid e ordena por número do item
 */
const itensOrdenados = computed(() => {
  if (!props.itemSelecionado.osid || !props.dadosCompletos.length) {
    return [];
  }

  // Filtra todos os itens com o mesmo osid
  const itensFiltrados = props.dadosCompletos.filter(item => 
    item.osid === props.itemSelecionado.osid
  );

  // Ordena por itOSItem
  return itensFiltrados.sort((a, b) => {
    const itemA = parseInt(a.itOSItem) || 0;
    const itemB = parseInt(b.itOSItem) || 0;
    return itemA - itemB;
  });
});

/**
 * Itens agrupados por lote para visualização
 * Agrupa os itens por lote e calcula totais por grupo
 */
const compararTextosNaturais = (valorA, valorB) => {
  const textoA = String(valorA || '').trim();
  const textoB = String(valorB || '').trim();

  // Endereços não preenchidos ficam por último.
  if (!textoA && textoB) return 1;
  if (textoA && !textoB) return -1;

  return textoA.localeCompare(textoB, 'pt-BR', {
    numeric: true,
    sensitivity: 'base'
  });
};

const compararPorNumeroDoItem = (itemA, itemB) => {
  return (parseInt(itemA.itOSItem) || 0) - (parseInt(itemB.itOSItem) || 0);
};

/**
 * Mantém os itens separados por lote. Quando a ordenação por origem está ativa,
 * ordena os itens dentro do lote e posiciona cada lote pela sua menor origem.
 */
const agruparItensPorLote = (itens) => {
  const grupos = new Map();

  itens.forEach(item => {
    const lote = item.lote || 'Sem Lote';

    if (!grupos.has(lote)) {
      grupos.set(lote, {
        lote,
        itens: [],
        totalItens: 0,
        totalQuantidade: 0,
        totalAtendida: 0,
        menorOrigem: ''
      });
    }

    const grupo = grupos.get(lote);
    grupo.itens.push(item);
    grupo.totalItens++;

    const peso = parseFloat(item.itOsPeso) || 0;
    grupo.totalQuantidade += peso;

    if (item.itOSStatus === 'AT') {
      grupo.totalAtendida += peso;
    }
  });

  const gruposOrdenados = Array.from(grupos.values());

  gruposOrdenados.forEach(grupo => {
    grupo.itens.sort((itemA, itemB) => {
      if (ordenarPorOrigem.value) {
        return compararTextosNaturais(itemA.itOsOrigem, itemB.itOsOrigem)
          || compararPorNumeroDoItem(itemA, itemB);
      }

      return compararPorNumeroDoItem(itemA, itemB);
    });

    grupo.menorOrigem = grupo.itens
      .map(item => item.itOsOrigem)
      .filter(origem => String(origem || '').trim())
      .sort(compararTextosNaturais)[0] || '';
  });

  if (ordenarPorOrigem.value) {
    gruposOrdenados.sort((grupoA, grupoB) => {
      return compararTextosNaturais(grupoA.menorOrigem, grupoB.menorOrigem)
        || compararTextosNaturais(grupoA.lote, grupoB.lote);
    });
  }

  return gruposOrdenados;
};

const itensAgrupadosPorLote = computed(() => {
  return agruparItensPorLote(itensOrdenados.value);
});

/**
 * Itens agrupados por lote para impressão
 * Similar ao anterior, mas exclui itens com status 'ER' (erro)
 */
const itensAgrupadosPorLoteParaImpressao = computed(() => {
  // Filtra itens que não têm status 'ER'
  const itensFiltrados = itensOrdenados.value.filter(item => item.itOSStatus !== 'ER');

  return agruparItensPorLote(itensFiltrados);
});

/* ========================================
   CAMADA DE CÁLCULOS E TOTALIZAÇÕES
======================================== */

/**
 * Total de quantidade de todos os itens da OS
 */
const totalQuantidade = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    const peso = parseFloat(item.itOsPeso) || 0;
    return total + peso;
  }, 0);
});

/**
 * Total de quantidade atendida (apenas itens com status 'AT')
 */
const totalAtendida = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    if (item.itOSStatus === 'AT') {
      const peso = parseFloat(item.itOsPeso) || 0;
      return total + peso;
    }
    return total;
  }, 0);
});

/**
 * Total de quantidade para impressão (excluindo itens 'ER')
 * Resultado já convertido para sacas (dividido por 59)
 */
const totalQuantidadeParaImpressao = computed(() => {
  const soma = itensOrdenados.value
    .filter(item => item.itOSStatus !== 'ER')
    .reduce((total, item) => {
      const peso = parseFloat(item.itOsPeso) || 0;
      return total + peso;
    }, 0);
  return soma / 59;
});

/**
 * Total atendida para impressão (excluindo itens 'ER')
 */
const totalAtendidaParaImpressao = computed(() => {
  return itensOrdenados.value
    .filter(item => item.itOSStatus !== 'ER')
    .reduce((total, item) => {
      if (item.itOSStatus === 'AT') {
        const peso = parseFloat(item.itOsPeso) || 0;
        return total + peso;
      }
      return total;
    }, 0);
});

/**
 * Total de itens para impressão (excluindo itens 'ER')
 */
const totalItensParaImpressao = computed(() => {
  return itensOrdenados.value.filter(item => item.itOSStatus !== 'ER').length;
});

/**
 * Data atual formatada para impressão
 */
const dataImpressao = computed(() => {
  const agora = new Date();
  return agora.toLocaleDateString('pt-BR');
});

/**
 * Hora atual formatada para impressão
 */
const horaImpressao = computed(() => {
  const agora = new Date();
  return agora.toLocaleTimeString('pt-BR');
});

/* ========================================
   CAMADA DE AÇÕES E CONTROLE DE UI
======================================== */

/**
 * Função para rolar até o rodapé do relatório
 */
const scrollToFooter = () => {
  if (reportFooter.value) {
    reportFooter.value.scrollIntoView({ behavior: 'smooth' });
  }
};

/**
 * Fechar o modal de impressão
 */
const fecharModal = () => {
  dialogVisible.value = false;
};

/**
 * Visualizar impressão em nova aba
 */
const visualizarImpressao = () => {
  const printWindow = window.open('', '_blank');
  const printContent = generatePrintHTML();
  
  printWindow.document.write(printContent);
  printWindow.document.close();
};

/**
 * Imprimir o relatório
 */
const imprimir = () => {
  const printWindow = window.open('', '_blank');
  const printContent = generatePrintHTML();
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Aguarda um pouco para carregar e depois imprime
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

/* ========================================
   CAMADA DE GERAÇÃO DE RELATÓRIOS
======================================== */

/**
 * Gera o HTML completo para impressão do relatório
 * Inclui estilos CSS, estrutura HTML e dados formatados
 * @returns {string} HTML completo para impressão
 */
const generatePrintHTML = () => {
  // === ESTILOS CSS PARA IMPRESSÃO ===
  const printStyles = `
    <style>
      /* Garantir que o cabeçalho seja repetido em cada página */
      @page {
        margin: 0.5cm;
      }
      
      /* Estilos para impressão */
      @media print {
        body { 
          font-family: Arial, sans-serif; 
          font-size: 16px; 
          margin: 0;
          color: black;
        }
        .no-print { display: none !important; }
        
        /* Cabeçalho do relatório */
        .report-header h2 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: bold;
        }
        
        /* Linha de informações principais */
        .info-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 8px 10px;
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }
        
        .info-line span {
          font-size: 14px;
        }
        
        /* Tabelas de dados */
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          table-layout: fixed;
        }
        
        /* Larguras específicas das colunas para alinhamento */
        .print-table th:nth-child(1), .print-table td:nth-child(1) { width: 5%; }  /* IT */
        .print-table th:nth-child(2), .print-table td:nth-child(2) { width: 9%; }  /* EMP */
        .print-table th:nth-child(3), .print-table td:nth-child(3) { width: 19%; } /* LOTE */
        .print-table th:nth-child(4), .print-table td:nth-child(4) { width: 8%; }  /* TAG */
        .print-table th:nth-child(5), .print-table td:nth-child(5) { width: 11%; } /* ORIGEM */
        .print-table th:nth-child(6), .print-table td:nth-child(6) { width: 11%; } /* DESTINO */
        .print-table th:nth-child(7), .print-table td:nth-child(7) { width: 11%; }  /* DEP. EM */
        .print-table th:nth-child(8), .print-table td:nth-child(8) { width: 18%; } /* OBSERVAÇÃO */
        .print-table th:nth-child(9), .print-table td:nth-child(9) { width: 8%; }  /* QTD.ORDEM */
        .print-table th:nth-child(10), .print-table td:nth-child(10) { width: 8%; } /* ATENDIDA */
        .print-table th:nth-child(11), .print-table td:nth-child(11) { width: 5%; } /* STATUS */
        /* Thead deve repetir em cada página */
        .main-data-table thead { display: table-header-group; }
        .main-data-table tfoot { display: table-footer-group; }
        
        .print-table th,
        .print-table td {
          border: none;
          padding: 3px 6px;
          text-align: left;
          font-size: 13px;
          line-height: 1.2;
          vertical-align: top;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          padding: 4px 6px;
          border-bottom: 3px solid #333 !important;
        }
        
        /* Otimizações para impressão */
        .print-table {
          page-break-inside: auto;
        }
        
        .print-table tr {
          height: auto;
          line-height: 1.2;
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        .print-table tbody tr {
          height: 22px;
        }
        
        /* Subtotais por lote */
        .subtotal-row td {
          padding: 6px 10px;
          background-color: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-weight: bold;
          font-size: 13px;
        }
        .subtotal-info { 
          display: flex; 
          justify-content: space-between; 
          gap: 10px; 
          align-items: center;
        }
        
        /* Rodapé do relatório */
        .report-footer {
          margin-top: 20px;
        }
        
        /* Seção de totais */
        .totals-section {
          display: flex;
          justify-content: space-around;
          border: 1px solid #ddd;
          padding: 8px 10px;
          background-color: #f9f9f9;
        }
        
        .totals-title-inline {
          font-size: 15px;
          font-weight: bold;
          border-right: 1px solid #333;
          padding-right: 10px;
          margin-right: 10px;
        }
        
        .total-item {
          font-size: 14px;
          font-weight: bold;
        }
        
        /* Informações de impressão */
        .print-info {
          text-align: center;
          margin-top: 12px;
          font-size: 13px;
          color: #666;
        }
      }
      
      /* Estilos para visualização em tela */
      @media screen {
        body { 
          font-family: Arial, sans-serif; 
          margin: 5px;
        }
        
        .report-header h2 {
          text-align: center;
          margin-bottom: 15px;
          font-size: 20px;
          font-weight: bold;
        }
        
        .info-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 8px 10px;
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }
        
        .lote-group {
          margin-bottom: 20px;
        }
        
        /* Tabelas de dados */
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
          table-layout: fixed;
        }
        
        /* Larguras específicas das colunas para alinhamento */
        .print-table th:nth-child(1), .print-table td:nth-child(1) { width: 4%; }  /* IT */
        .print-table th:nth-child(2), .print-table td:nth-child(2) { width: 6%; }  /* EMP */
        .print-table th:nth-child(3), .print-table td:nth-child(3) { width: 9%; }  /* LOTE */
        .print-table th:nth-child(4), .print-table td:nth-child(4) { width: 8%; }  /* TAG */
        .print-table th:nth-child(5), .print-table td:nth-child(5) { width: 11%; } /* ORIGEM */
        .print-table th:nth-child(6), .print-table td:nth-child(6) { width: 12%; } /* DESTINO */
        .print-table th:nth-child(7), .print-table td:nth-child(7) { width: 8%; font-size: 20px !important; }  /* DEP. EM */
        .print-table th:nth-child(8), .print-table td:nth-child(8) { width: 18%; } /* OBSERVAÇÃO */
        .print-table th:nth-child(9), .print-table td:nth-child(9) { width: 9%; }  /* QTD.ORDEM */
        .print-table th:nth-child(10), .print-table td:nth-child(10) { width: 9%; } /* ATENDIDA */
        .print-table th:nth-child(11), .print-table td:nth-child(11) { width: 9%; } /* STATUS */
        
        /* Cabeçalho principal - sempre visível */
        .main-data-table thead { display: table-header-group; }
        
        .print-table th,
        .print-table td {
          border: 1px solid #ddd;
          padding: 4px 6px;
          text-align: left;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .print-table th {
          background-color: #37474f;
          color: white;
          font-weight: bold;
          text-align: center;
          font-size: 12px;
          border-bottom: 3px solid #333 !important;
        }
        
        .subtotal-row td {
          padding: 6px 10px;
          background-color: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-weight: bold;
          color: #333;
          font-size: 13px;
        }
        .subtotal-info { 
          display: flex; 
          justify-content: space-between; 
          gap: 10px; 
          align-items: center;
        }
        
        .totals-section {
          display: flex;
          justify-content: space-around;
          border: 1px solid #ddd;
          padding: 8px 10px;
          background-color: #f9f9f9;
        }
        
        .totals-title-inline {
          font-size: 16px;
          font-weight: bold;
          border-right: 2px solid #333;
          padding-right: 10px;
          margin-right: 10px;
        }
        
        .total-item {
          font-weight: bold;
          font-size: 14px;
        }
        
        .print-info {
          text-align: center;
          margin-top: 12px;
          font-size: 12px;
          color: #666;
        }
      }
    </style>
  `;

  // === GERAÇÃO DE UM ÚNICO TBODY COM TODOS OS LOTES (PARA REPETIR O THEAD EM CADA PÁGINA) ===
  const tbodyRowsHTML = itensAgrupadosPorLoteParaImpressao.value.map(grupo => {
    const lote = grupo.lote;
    const itemRows = grupo.itens.map(item => `
      <tr>
        <td>${item.itOSItem}</td>
        <td>${item.empiCod}</td>
        <td>${item.lote}</td>
        <td>${formatarTag(item.itOsTagBag)}</td>
        <td>${item.itOsOrigem}</td>
        <td>${item.itOsDestino}</td>
        <td>${item.itOSStatus === 'AT' ? item.itOsDestinoDepEm : '-'}</td>
        <td style="font-size:9px;">${item.itOsObs || '-'}</td>
        <td>${formatarPeso(item.itOsPeso/59)}</td>
        <td>${item.itOSStatus === 'AT' ? formatarPeso(item.itOsPeso/59) : '0,00'}</td>
        <td>${item.itOSStatus}</td>
      </tr>
    `).join('');

    const subtotalRow = `
      <tr class="subtotal-row">
        <td colspan="11">
          <div class="subtotal-info">
            <span><strong>Subtotal do ${lote}:</strong></span>
            <span><strong>Itens:</strong> ${grupo.totalItens}</span>
            <span><strong>Quantidade:</strong> ${formatarPeso(grupo.totalQuantidade/59)} sacas</span>
            <span><strong>Atendida:</strong> ${formatarPeso(grupo.totalAtendida/59)} sacas</span>
          </div>
        </td>
      </tr>
    `;

    return `${itemRows}${subtotalRow}`;
  }).join('');

  // === DOCUMENTO HTML COMPLETO ===
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório da Ordem de Serviço - ${numeroOrdem.value}</title>
      ${printStyles}
    </head>
    <body style="margin: 0;">
      <div class="print-area">
        <!-- Cabeçalho -->
        <div class="report-header">
          <h2>Relatório da Ordem de Serviço - ${numeroOrdem.value}</h2>
          <div class="info-line">
            <span><strong>ORDEM:</strong> ${dadosOrdem.value.opTck || '-'}</span>
            <span><strong>DATA:</strong> ${formatarData(dadosOrdem.value.osdata)}</span>
            <span><strong>HORA:</strong> ${formatarHora(dadosOrdem.value.oshora)}</span>
            <span><strong>BLOCO:</strong> ${dadosOrdem.value.osblocoSuger || '-'}</span>
            <span><strong>PRIORIDADE:</strong> ${dadosOrdem.value.osprioridade || '-'}</span>
          </div>
        </div>
        
        <!-- Tabela única com thead (repetido no início de cada página) e todos os itens -->
        <table class="print-table main-data-table">
          <thead>
            <tr>
              <th>IT</th>
              <th>EMP</th>
              <th>LOTE</th>
              <th>TAG</th>
              <th>ORIGEM</th>
              <th>DES-<br>TINO</th>
              <th>DEP. EM</th>
              <th>OBSERVAÇÃO</th>
              <th>QTD.<br>ORDEM</th>
              <th>ATEN-<br>DIDA</th>
              <th>STA-<br>TUS</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyRowsHTML}
          </tbody>
        </table>
        
        <!-- Rodapé -->
        <div class="report-footer">
          <div class="totals-section">
            <div class="total-item totals-title-inline">
              <strong>Total Geral da Guia:</strong>
            </div>
            <div class="total-item">
              <strong>Total de Itens:</strong> ${totalItensParaImpressao.value}
            </div>
            <div class="total-item">
              <strong>Quantidade Total:</strong> ${formatarPeso(totalQuantidadeParaImpressao.value)} sacas
            </div>
            <div class="total-item">
              <strong>Quantidade Atendida:</strong> ${formatarPeso(totalAtendidaParaImpressao.value/59)} sacas
            </div>
            <div class="total-item">
              <strong>Quantidade Restante:</strong> ${formatarPeso(totalQuantidadeParaImpressao.value - totalAtendidaParaImpressao.value/59)} sacas
            </div>
          </div>
          
          <!-- Informações de impressão -->
          <div class="print-info">
            <div class="total-item"><strong>Projeto Comexim - WMS</strong></div>
            <small>Impresso em ${dataImpressao.value} às ${horaImpressao.value}</small>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
</script>

<style scoped>
/* Estilos para visualização na tela */

/* Cabeçalho fixo ao rolar */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.print-area {
  background: white;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.report-header h2 {
  text-align: center;
  margin-bottom: 15px;
  color: #1976d2;
  font-weight: bold;
}

.info-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
  flex-wrap: wrap;
  gap: 8px;
}

.info-line span {
  font-size: 13px;
  color: #333;
}

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
          table-layout: fixed;
        }
        
        /* Larguras específicas das colunas para alinhamento */
        .print-table th:nth-child(1), .print-table td:nth-child(1) { width: 4%; }  /* IT */
        .print-table th:nth-child(2), .print-table td:nth-child(2) { width: 6%; }  /* EMP */
        .print-table th:nth-child(3), .print-table td:nth-child(3) { width: 11%; }  /* LOTE */
        .print-table th:nth-child(4), .print-table td:nth-child(4) { width: 8%; }  /* TAG */
        .print-table th:nth-child(5), .print-table td:nth-child(5) { width: 12%; } /* ORIGEM */
        .print-table th:nth-child(6), .print-table td:nth-child(6) { width: 12%; } /* DESTINO */
        .print-table th:nth-child(7), .print-table td:nth-child(7) { width: 8%; }  /* DEP. EM */
        .print-table th:nth-child(8), .print-table td:nth-child(8) { width: 17%; } /* OBSERVAÇÃO */
        .print-table th:nth-child(9), .print-table td:nth-child(9) { width: 9%; }  /* QTD.ORDEM */
        .print-table th:nth-child(10), .print-table td:nth-child(10) { width: 9%; } /* ATENDIDA */
        .print-table th:nth-child(11), .print-table td:nth-child(11) { width: 9%; } /* STATUS */
        
        .print-table th,
        .print-table td {
          border: none;
          padding: 3px 6px;
          text-align: left;
          font-size: 13px;
          line-height: 1.2;
          vertical-align: top;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          padding: 4px 6px;
        }

.origem-sort-button {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
}

.origem-sort-button:hover,
.origem-sort-button--active {
  color: #1565c0;
}
        
        .print-table tr {
          height: auto;
        }
        
        .print-table tbody tr {
          height: 22px;
        }.lote-group {
  margin-bottom: 20px;
}


.subtotal-lote {
  margin-bottom: 12px;
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.subtotal-info {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  color: #333;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
}

.report-footer {
  margin-top: 15px;
}

.totals-section {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background-color: #e8f5e8;
  border-radius: 4px;
  border: 1px solid #4caf50;
}

.totals-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.totals-title-inline {
  font-size: 16px;
  font-weight: bold;
  color: #1b5e20;
  border-right: 2px solid #4caf50;
  padding-right: 15px;
  margin-right: 10px;
}

.totals-section .total-item {
  white-space: nowrap;
  font-weight: bold;
}

.total-item {
  font-size: 13px;
  font-weight: bold;
  color: #2e7d32;
}

.print-info {
  text-align: center;
  margin-top: 12px;
  color: #666;
  font-style: italic;
  font-size: 11px;
}

.action-buttons {
  border-top: 1px solid #ddd;
  padding-top: 12px;
}

/* Estilos para impressão */
@media print {
  .no-print {
    display: none !important;
  }
  
  .print-area {
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .info-line {
    background-color: #f9f9f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .print-table th {
    background-color: #f0f0f0 !important;
    color: black !important;
    border-bottom: 3px solid #333 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .totals-section {
    background-color: #f9f9f9 !important;
    border: 1px solid #333 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .totals-title-inline {
    color: #000 !important;
    border-right: 2px solid #333 !important;
    font-weight: bold !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .total-item {
    color: #000 !important;
    font-weight: bold !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* Responsividade */
@media (max-width: 768px) {
  .info-line {
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
  }
  
  .print-table {
    font-size: 10px;
    table-layout: fixed;
  }
  
  .print-table th,
  .print-table td {
    padding: 1px 3px;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  /* Manter larguras das colunas mesmo em mobile */
  .print-table th:nth-child(1), .print-table td:nth-child(1) { width: 4%; }  /* IT */
  .print-table th:nth-child(2), .print-table td:nth-child(2) { width: 6%; }  /* EMP */
  .print-table th:nth-child(3), .print-table td:nth-child(3) { width: 8%; }  /* LOTE */
  .print-table th:nth-child(4), .print-table td:nth-child(4) { width: 8%; }  /* TAG */
  .print-table th:nth-child(5), .print-table td:nth-child(5) { width: 12%; } /* ORIGEM */
  .print-table th:nth-child(6), .print-table td:nth-child(6) { width: 12%; } /* DESTINO */
  .print-table th:nth-child(7), .print-table td:nth-child(7) { width: 8%; }  /* DEP. EM */
  .print-table th:nth-child(8), .print-table td:nth-child(8) { width: 15%; } /* OBSERVAÇÃO */
  .print-table th:nth-child(9), .print-table td:nth-child(9) { width: 9%; }  /* QTD.ORDEM */
  .print-table th:nth-child(10), .print-table td:nth-child(10) { width: 9%; } /* ATENDIDA */
  .print-table th:nth-child(11), .print-table td:nth-child(11) { width: 9%; } /* STATUS */
  
  .print-table tbody tr {
    height: 14px;
  }
  
  .totals-section {
    padding: 6px 10px;
  }
  
  .totals-items {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .totals-title-inline {
    font-size: 14px;
    border-right: none;
    border-bottom: 1px solid #4caf50;
    padding-right: 0;
    padding-bottom: 5px;
    margin-right: 0;
    margin-bottom: 5px;
  }
  
  .totals-section .total-item {
    font-size: 12px;
  }
  
  .subtotal-info {
    flex-direction: column;
    text-align: center;
    gap: 4px;
    font-size: 11px;
  }
  

  
  .subtotal-lote {
    padding: 5px 10px;
    margin-bottom: 10px;
  }

  .detalhes-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
