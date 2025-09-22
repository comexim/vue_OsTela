<template>
  <v-dialog v-model="dialogVisible" max-width="1200px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-primary text-white d-flex align-center">
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

          <!-- Tabelas separadas por lote -->
          <div v-for="(grupo, lote) in itensAgrupadosPorLote" :key="lote" class="lote-group">
            <!-- Cabeçalho do lote -->


            <!-- Tabela do lote -->
            <table class="print-table">
              <thead>
                <tr>
                  <th>IT</th>
                  <th>EMP</th>
                  <th>LOTE</th>
                  <th>TAG</th>
                  <th>ORIGEM</th>
                  <th>DESTINO</th>
                  <th>DEP. EM</th>
                  <th>OBSERVAÇÃO</th>
                  <th>QTD.ORDEM</th>
                  <th>ATENDIDA</th>
                  <th>STATUS</th>
                </tr>
              </thead>
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
                  <td>{{ formatarPeso(item.itOsPeso) }}</td>
                  <td>{{ item.itOSStatus === 'AT' ? formatarPeso(item.itOsPeso) : '0,00' }}</td>
                  <td>{{ item.itOSStatus }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Subtotal do lote -->
            <div class="subtotal-lote">
              <div class="subtotal-info">
                <span><strong>Subtotal do {{ lote }}:</strong></span>
                <span><strong>Itens:</strong> {{ grupo.totalItens }}</span>
                <span><strong>Quantidade:</strong> {{ formatarPeso(grupo.totalQuantidade) }} kg</span>
                <span><strong>Atendida:</strong> {{ formatarPeso(grupo.totalAtendida) }} kg</span>
              </div>
            </div>
          </div>

          <!-- Rodapé com totais -->
      <div class="report-footer mt-4" ref="reportFooter">
            <div class="totals-section">
              <div class="totals-items">
                <div class="total-item totals-title-inline">
                  <strong>Total Geral da Guia:</strong>
                </div>
                <div class="total-item">
                  <strong>Total de Itens:</strong> {{ itensOrdenados.length }}
                </div>
                <div class="total-item">
                  <strong>Quantidade Total:</strong> {{ formatarPeso(totalQuantidade) }} kg
                </div>
                <div class="total-item">
                  <strong>Quantidade Atendida:</strong> {{ formatarPeso(totalAtendida) }} kg
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

// Props
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

// Emits
const emit = defineEmits(['update:modelValue']);

// Data local
const dialogVisible = ref(props.modelValue);
const printArea = ref(null);
const reportFooter = ref(null);
// Função para rolar até o rodapé do relatório
const scrollToFooter = () => {
  if (reportFooter.value) {
    reportFooter.value.scrollIntoView({ behavior: 'smooth' });
  }
};

// Watch para sincronizar o v-model
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
});

// Computed para obter dados da ordem
const dadosOrdem = computed(() => {
  if (!props.itemSelecionado.osid || !props.dadosCompletos.length) {
    return {};
  }
  
  // Pega o primeiro item da ordem para obter dados gerais
  return props.dadosCompletos.find(item => item.osid === props.itemSelecionado.osid) || {};
});

// Computed para número da ordem
const numeroOrdem = computed(() => {
  return dadosOrdem.value.opTck || props.itemSelecionado.opTck || 'N/A';
});

// Computed para filtrar e ordenar itens pelo mesmo osid
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

// Computed para agrupar itens por lote
const itensAgrupadosPorLote = computed(() => {
  const grupos = {};
  
  itensOrdenados.value.forEach(item => {
    const lote = item.lote || 'Sem Lote';
    
    if (!grupos[lote]) {
      grupos[lote] = {
        itens: [],
        totalItens: 0,
        totalQuantidade: 0,
        totalAtendida: 0
      };
    }
    
    grupos[lote].itens.push(item);
    grupos[lote].totalItens++;
    
    const peso = parseFloat(item.itOsPeso) || 0;
    grupos[lote].totalQuantidade += peso;
    
    if (item.itOSStatus === 'AT') {
      grupos[lote].totalAtendida += peso;
    }
  });
  
  // Ordena os itens dentro de cada lote por itOSItem
  Object.keys(grupos).forEach(lote => {
    grupos[lote].itens.sort((a, b) => {
      const itemA = parseInt(a.itOSItem) || 0;
      const itemB = parseInt(b.itOSItem) || 0;
      return itemA - itemB;
    });
  });
  
  return grupos;
});

// Computed para agrupar itens por lote (para impressão - sem itens ER)
const itensAgrupadosPorLoteParaImpressao = computed(() => {
  const grupos = {};
  
  // Filtra itens que não têm status 'ER'
  const itensFiltrados = itensOrdenados.value.filter(item => item.itOSStatus !== 'ER');
  
  itensFiltrados.forEach(item => {
    const lote = item.lote || 'Sem Lote';
    
    if (!grupos[lote]) {
      grupos[lote] = {
        itens: [],
        totalItens: 0,
        totalQuantidade: 0,
        totalAtendida: 0
      };
    }
    
    grupos[lote].itens.push(item);
    grupos[lote].totalItens++;
    
    const peso = parseFloat(item.itOsPeso) || 0;
    grupos[lote].totalQuantidade += peso;
    
    if (item.itOSStatus === 'AT') {
      grupos[lote].totalAtendida += peso;
    }
  });
  
  // Ordena os itens dentro de cada lote por itOSItem
  Object.keys(grupos).forEach(lote => {
    grupos[lote].itens.sort((a, b) => {
      const itemA = parseInt(a.itOSItem) || 0;
      const itemB = parseInt(b.itOSItem) || 0;
      return itemA - itemB;
    });
  });
  
  return grupos;
});

// Computed para total de quantidade
const totalQuantidade = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    const peso = parseFloat(item.itOsPeso) || 0;
    return total + peso;
  }, 0);
});

// Computed para total atendida
const totalAtendida = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    if (item.itOSStatus === 'AT') {
      const peso = parseFloat(item.itOsPeso) || 0;
      return total + peso;
    }
    return total;
  }, 0);
});

// Computed para total de quantidade (para impressão - sem itens ER)
const totalQuantidadeParaImpressao = computed(() => {
  return itensOrdenados.value
    .filter(item => item.itOSStatus !== 'ER')
    .reduce((total, item) => {
      const peso = parseFloat(item.itOsPeso) || 0;
      return total + peso;
    }, 0);
});

// Computed para total atendida (para impressão - sem itens ER)
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

// Computed para total de itens (para impressão - sem itens ER)
const totalItensParaImpressao = computed(() => {
  return itensOrdenados.value.filter(item => item.itOSStatus !== 'ER').length;
});

// Computed para data e hora de impressão
const dataImpressao = computed(() => {
  const agora = new Date();
  return agora.toLocaleDateString('pt-BR');
});

const horaImpressao = computed(() => {
  const agora = new Date();
  return agora.toLocaleTimeString('pt-BR');
});

// Funções de formatação
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

const formatarPeso = (value) => {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatarTag = (value) => {
  if (!value) return '-';
  // Retorna apenas os últimos 6 números
  return value.slice(-6);
};

// Função para fechar o modal
const fecharModal = () => {
  dialogVisible.value = false;
};

// Função para visualizar impressão (abre o conteúdo numa nova aba)
const visualizarImpressao = () => {
  const printWindow = window.open('', '_blank');
  const printContent = generatePrintHTML();
  
  printWindow.document.write(printContent);
  printWindow.document.close();
};

// Função para imprimir
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

// Função para gerar o HTML da impressão
const generatePrintHTML = () => {
  const printStyles = `
    <style>
      @media print {
        body { 
          font-family: Arial, sans-serif; 
          font-size: 14px; 
          margin: 5px;
          color: black;
        }
        .no-print { display: none !important; }
        
        .report-header h2 {
          text-align: center;
          margin-bottom: 15px;
          font-size: 22px;
          font-weight: bold;
        }
        
        .info-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 6px 8px;
          border: 1px solid #ddd;
          background-color: #f9f9f9;
        }
        
        .info-line span {
          font-size: 12px;
        }
        
        .lote-group {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        

        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 5px;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #333;
          padding: 1px 3px;
          text-align: left;
          font-size: 11px;
          line-height: 1;
          vertical-align: top;
        }
        
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          padding: 2px 3px;
        }
        
        .print-table tr {
          height: auto;
          line-height: 1;
        }
        
        .print-table tbody tr {
          height: 18px;
        }
        
        .subtotal-lote {
          margin-bottom: 8px;
          padding: 4px 8px;
          background-color: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 3px;
        }
        
        .subtotal-info {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: bold;
        }
        
        .report-footer {
          margin-top: 15px;
        }
        
        .totals-section {
          display: flex;
          justify-content: space-around;
          border: 1px solid #ddd;
          padding: 6px 8px;
          background-color: #f9f9f9;
        }
        
        .totals-title-inline {
          font-size: 13px;
          font-weight: bold;
          border-right: 1px solid #333;
          padding-right: 8px;
          margin-right: 8px;
        }
        
        .total-item {
          font-size: 12px;
          font-weight: bold;
        }
        
        .print-info {
          text-align: center;
          margin-top: 10px;
          font-size: 11px;
          color: #666;
        }
      }
      
      @media screen {
        body { 
          font-family: Arial, sans-serif; 
          margin: 10px;
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
        

        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #333;
          padding: 4px 6px;
          text-align: left;
          font-size: 13px;
        }
        
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .subtotal-lote {
          margin-bottom: 12px;
          padding: 6px 10px;
          background-color: #f5f5f5;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .subtotal-info {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          color: #333;
          font-size: 13px;
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

  // Gerar HTML para cada grupo de lote
  const lotesHTML = Object.keys(itensAgrupadosPorLoteParaImpressao.value).map(lote => {
    const grupo = itensAgrupadosPorLoteParaImpressao.value[lote];
    
    const tableRows = grupo.itens.map(item => `
      <tr>
        <td>${item.itOSItem}</td>
        <td>${item.empiCod}</td>
        <td>${item.lote}</td>
        <td>${formatarTag(item.itOsTagBag)}</td>
        <td>${item.itOsOrigem}</td>
        <td>${item.itOsDestino}</td>
        <td>${item.itOSStatus === 'AT' ? item.itOsDestinoDepEm : '-'}</td>
        <td>${item.itOsObs || '-'}</td>
        <td>${formatarPeso(item.itOsPeso)}</td>
        <td>${item.itOSStatus === 'AT' ? formatarPeso(item.itOsPeso) : '0,00'}</td>
        <td>${item.itOSStatus}</td>
      </tr>
    `).join('');

    return `
      <div class="lote-group">

        
        <table class="print-table">
          <thead>
            <tr>
              <th>IT</th>
              <th>EMP</th>
              <th>LOTE</th>
              <th>TAG</th>
              <th>ORIGEM</th>
              <th>DESTINO</th>
              <th>DEP. EM</th>
              <th>OBSERVAÇÃO</th>
              <th>QTD.ORDEM</th>
              <th>ATENDIDA</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        <div class="subtotal-lote">
          <div class="subtotal-info">
            <span><strong>Subtotal do ${lote}:</strong></span>
            <span><strong>Itens:</strong> ${grupo.totalItens}</span>
            <span><strong>Quantidade:</strong> ${formatarPeso(grupo.totalQuantidade)} kg</span>
            <span><strong>Atendida:</strong> ${formatarPeso(grupo.totalAtendida)} kg</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório da Ordem de Serviço - ${numeroOrdem.value}</title>
      ${printStyles}
    </head>
    <body style="margin: 5px;">
      <div class="print-area">
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

        ${lotesHTML}

        <div class="report-footer">
          <div class="totals-section">
            <div class="total-item totals-title-inline">
              <strong>Total Geral da Guia:</strong>
            </div>
            <div class="total-item">
              <strong>Total de Itens:</strong> ${totalItensParaImpressao.value}
            </div>
            <div class="total-item">
              <strong>Quantidade Total:</strong> ${formatarPeso(totalQuantidadeParaImpressao.value)} kg
            </div>
            <div class="total-item">
              <strong>Quantidade Atendida:</strong> ${formatarPeso(totalAtendidaParaImpressao.value)} kg
            </div>
          </div>
          
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
  margin-bottom: 8px;
}

.print-table th,
.print-table td {
  border: 1px solid #ddd;
  padding: 2px 6px;
  text-align: left;
  line-height: 1.1;
  vertical-align: top;
}

.print-table th {
  background-color: #37474f;
  color: white;
  font-weight: bold;
  text-align: center;
  font-size: 12px;
  padding: 3px 6px;
}

.print-table td {
  font-size: 11px;
}

.print-table tr {
  height: auto;
}

.lote-group {
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
  }
  
  .print-table th,
  .print-table td {
    padding: 1px 3px;
    line-height: 1;
  }
  
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
}
</style>
