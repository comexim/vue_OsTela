<template>
    <v-container class="container">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center ga-3">
            <h1 class="titulo-pagina">Log Movimentações</h1>
            <v-chip
              v-if="dados.length > 0"
              color="success"
              variant="tonal"
              prepend-icon="mdi-table"
            >
              {{ dados.length }} registros
            </v-chip>
          </div>
          
          <v-btn
            v-if="mostrarTabela"
            color="primary"
            @click="onFilter"
            :loading="loading"
            prepend-icon="mdi-refresh"
            variant="elevated"
            size="default"
          >
            Atualizar
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="pa-3 border rounded-xl elevation-2 mb-3">
            <v-form @submit.prevent="onFilter">
              <v-row align="center" justify="start" dense>
                <v-col cols="12" md="3">
                  <v-select
                    label="Tipo"
                    variant="outlined"
                    v-model="selectedTipo"
                    :items="tipos"
                    density="compact"
                    hide-details
                  ></v-select>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field 
                    label="Data Inicial" 
                    variant="outlined" 
                    v-model="dataInicial"
                    type="date"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field 
                    label="Data Final" 
                    variant="outlined" 
                    v-model="dataFinal"
                    type="date"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3" class="d-flex justify-center">
                  <v-btn 
                    variant="tonal" 
                    color="blue-accent-4" 
                    prepend-icon="mdi-magnify" 
                    @click="onFilter"
                    :loading="loading"
                    block
                  >
                    Filtrar
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </div>

          <!-- Seção de Resumo do Inventário -->
          <div v-if="selectedTipo === 'Inventario' && mostrarTabela" class="resumo-inventario pa-4 border rounded-xl elevation-2 mb-4" id="resumo-inventario">
            <div class="d-flex justify-space-between align-center mb-3">
              <div class="resumo-titulo">
                <v-icon color="green-darken-2" class="mr-2">mdi-clipboard-list</v-icon>
                <span>Resumo do Inventário</span>
              </div>
              <v-btn
                size="small"
                variant="tonal"
                color="green-darken-2"
                prepend-icon="mdi-printer"
                @click="imprimirResumo"
              >
                Imprimir
              </v-btn>
            </div>
            
            <!-- Cards de Resumo Principal -->
            <v-row dense class="mb-2">
              <v-col cols="12" md="3">
                <v-card density="compact" class="resumo-card pa-3" elevation="1">
                  <div class="resumo-card-label">
                    <v-icon size="small" color="green-darken-2">mdi-clock-start</v-icon>
                    Hora Início
                  </div>
                  <div class="resumo-card-value">{{ resumoInventario.horaInicio }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card density="compact" class="resumo-card pa-3" elevation="1">
                  <div class="resumo-card-label">
                    <v-icon size="small" color="green-darken-2">mdi-clock-end</v-icon>
                    Hora Fim
                  </div>
                  <div class="resumo-card-value">{{ resumoInventario.horaFim }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card density="compact" class="resumo-card pa-3" elevation="1">
                  <div class="resumo-card-label">
                    <v-icon size="small" color="green-darken-2">mdi-package-variant</v-icon>
                    Total de Bags
                  </div>
                  <div class="resumo-card-value">{{ resumoInventario.totalBags }}</div>
                </v-card>
              </v-col>
              <v-col cols="12" md="3">
                <v-card density="compact" class="resumo-card pa-3" elevation="1">
                  <div class="resumo-card-label">
                    <v-icon size="small" color="green-darken-2">mdi-weight-kilogram</v-icon>
                    Total de Sacas
                  </div>
                  <div class="resumo-card-value">{{ resumoInventario.totalSacas }}</div>
                </v-card>
              </v-col>
            </v-row>
            
            <!-- Detalhes Adicionais -->
            <v-row dense>
              <v-col cols="12" md="6">
                <v-card density="compact" class="resumo-card pa-3" elevation="1">
                  <div class="resumo-card-label mb-2">
                    <v-icon size="small" color="green-darken-2">mdi-clock-outline</v-icon>
                    Bags por Hora
                  </div>
                  <div class="resumo-detalhes" style="max-height: 80px; overflow-y: auto;">
                    <v-row dense no-gutters>
                      <v-col 
                        v-for="(qtd, hora) in resumoInventario.bagsPorHora" 
                        :key="hora" 
                        cols="6"
                        class="px-1 py-1"
                      >
                        <div class="d-flex justify-space-between resumo-item">
                          <span>{{ hora }}</span>
                          <span class="font-weight-bold">{{ qtd }}</span>
                        </div>
                      </v-col>
                    </v-row>
                  </div>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card density="compact" class="resumo-card pa-3" elevation="1">
                  <div class="resumo-card-label mb-2">
                    <v-icon size="small" color="green-darken-2">mdi-account-group</v-icon>
                    Bags por Operador
                  </div>
                  <div class="resumo-detalhes" style="max-height: 80px; overflow-y: auto;">
                    <v-row dense no-gutters>
                      <v-col 
                        v-for="(qtd, operador) in resumoInventario.bagsPorOperador" 
                        :key="operador" 
                        cols="6" 
                        md="4"
                        class="px-1 py-1"
                      >
                        <div class="d-flex justify-space-between resumo-item">
                          <span>{{ operador }}</span>
                          <span class="font-weight-bold">{{ qtd }}</span>
                        </div>
                      </v-col>
                    </v-row>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Modal de Confirmação de Impressão -->
          <v-dialog v-model="mostrarDialogoImpressao" max-width="500">
            <v-card>
              <v-card-title class="bg-green-darken-2 text-white">
                <v-icon class="mr-2">mdi-printer</v-icon>
                Impressão do Resumo
              </v-card-title>
              <v-card-text class="pt-4 pb-2">
                <div class="text-h6 mb-2">Gostaria de imprimir a tabela de dados junto com o resumo?</div>
              </v-card-text>
              <v-card-actions class="px-4 pb-4">
                <v-spacer></v-spacer>
                <v-btn
                  variant="outlined"
                  color="grey-darken-1"
                  @click="confirmarImpressao(false)"
                >
                  Não
                </v-btn>
                <v-btn
                  variant="flat"
                  color="green-darken-2"
                  @click="confirmarImpressao(true)"
                >
                  Sim
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Componente da Tabela -->
          <logTable
            :dados="dados"
            :headers="headers"
            :label-map-completo="labelMapCompleto"
            :loading="loading"
            :mostrar-tabela="mostrarTabela"
            :altura-tabela="450"
            :resumo-inventario="resumoInventario"
            :tipo-selecionado="selectedTipo"
            v-model:busca="busca"
            @atualizar="onFilter"
          />
        </v-card-text>
      </v-card>
    </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import BasePage from '@/components/BasePage.vue';
import logTable from './components/logTable.vue';
import { movEnder } from '../../stores/Consultas/getMovEnder';

const movEnderStore = movEnder();

const dados = ref([]);
const headers = ref([]);
const labelMapCompleto = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);
const mostrarDialogoImpressao = ref(false);

// Campos do filtro
const selectedTipo = ref('');
const dataInicial = ref('');
const dataFinal = ref('');
const tipos = ref(['Embegadora', 'Inventario', 'Pesagem', 'Empilhadeira']);

// Função para filtrar e carregar dados da API
const onFilter = async () => {
  // Validação básica
  if (!selectedTipo.value && !dataInicial.value && !dataFinal.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
    const params = {
      tipo: selectedTipo.value,
      dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      usuario: localStorage.getItem('user')
    };

    console.log('Parâmetros enviados para a API:', params);

    const response = await movEnderStore.movEnder(params);
    console.log('Dados recebidos da API:', response);

    if (response && Array.isArray(response.listMov)) {
      dados.value = response.listMov;
      headers.value = gerarHeaders(response.listMov, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
    } else {
      console.warn('Formato de dados inesperado:', response);
      dados.value = [];
      headers.value = [];
      labelMapCompleto.value = [];
    }

    mostrarTabela.value = true;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    dados.value = [];
    headers.value = [];
    alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
  } finally {
    loading.value = false;
  }
};

// Computed para resumo do inventário
const resumoInventario = computed(() => {
  if (selectedTipo.value !== 'Inventario' || !dados.value || dados.value.length === 0) {
    return {
      horaInicio: '-',
      horaFim: '-',
      totalBags: 0,
      totalSacas: '0.00',
      bagsPorHora: {},
      bagsPorOperador: {}
    };
  }

  const bagsTags = new Set();
  let pesoTotal = 0;
  const bagsPorHora = {};
  const bagsPorOperador = {};
  let dataHoraInicio = null;
  let dataHoraFim = null;

  dados.value.forEach(item => {
    // Contabilizar bags únicos
    if (item.bagTag) {
      bagsTags.add(item.bagTag);
    }

    // Somar peso para cálculo de sacas
    if (item.movEnderPeso) {
      pesoTotal += parseFloat(item.movEnderPeso) || 0;
    }

    // Contabilizar bags por hora
    if (item.movEnderHora) {
      const hora = item.movEnderHora.substring(0, 2) + ':00'; // Agrupa por hora cheia
      bagsPorHora[hora] = (bagsPorHora[hora] || 0) + 1;
    }

    // Contabilizar bags por operador
    if (item.motCod) {
      bagsPorOperador[item.motCod] = (bagsPorOperador[item.motCod] || 0) + 1;
    }

    // Determinar hora início e fim comparando data e hora
    if (item.movEnderData && item.movEnderHora) {
      // Converter DD/MM/YYYY HH:MM para objeto Date
      const [dia, mes, ano] = item.movEnderData.split('/');
      const [hora, minuto] = item.movEnderHora.split(':');
      const dataHoraAtual = new Date(ano, mes - 1, dia, hora, minuto);
      
      if (!dataHoraInicio || dataHoraAtual < dataHoraInicio) {
        dataHoraInicio = dataHoraAtual;
      }
      if (!dataHoraFim || dataHoraAtual > dataHoraFim) {
        dataHoraFim = dataHoraAtual;
      }
    }
  });

  // Formatar data/hora
  const formatarDataHora = (dataObj) => {
    if (!dataObj) return '-';
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const hora = String(dataObj.getHours()).padStart(2, '0');
    const minuto = String(dataObj.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} ${hora}:${minuto}`;
  };

  return {
    horaInicio: formatarDataHora(dataHoraInicio),
    horaFim: formatarDataHora(dataHoraFim),
    totalBags: bagsTags.size,
    totalSacas: (pesoTotal / 59).toFixed(2),
    bagsPorHora: Object.fromEntries(
      Object.entries(bagsPorHora).sort(([a], [b]) => a.localeCompare(b))
    ),
    bagsPorOperador: Object.fromEntries(
      Object.entries(bagsPorOperador).sort(([a], [b]) => a.localeCompare(b))
    )
  };
});

// Função para imprimir resumo do inventário
const imprimirResumo = () => {
  // Abre o modal de confirmação
  mostrarDialogoImpressao.value = true;
};

// Função para confirmar a impressão após escolha do usuário
const confirmarImpressao = (imprimirTabela) => {
  // Fecha o modal
  mostrarDialogoImpressao.value = false;
  
  const printWindow = window.open('', '', 'height=800,width=1000');
  
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir');
    return;
  }

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR');

  // Gera HTML para Bags por Hora em duas colunas
  const bagsPorHoraEntries = Object.entries(resumoInventario.value.bagsPorHora);
  const metade = Math.ceil(bagsPorHoraEntries.length / 2);
  const coluna1 = bagsPorHoraEntries.slice(0, metade);
  const coluna2 = bagsPorHoraEntries.slice(metade);
  
  const bagsPorHoraHTML = coluna1.map((entry, index) => {
    const [hora1, qtd1] = entry;
    const col2 = coluna2[index];
    const hora2 = col2 ? col2[0] : '';
    const qtd2 = col2 ? col2[1] : '';
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${hora1}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${qtd1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${hora2}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${qtd2}</td>
      </tr>
    `;
  }).join('');

  // Gera HTML para Bags por Operador
  const bagsPorOperadorHTML = Object.entries(resumoInventario.value.bagsPorOperador)
    .map(([operador, qtd]) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${operador}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${qtd}</td>
      </tr>
    `).join('');

  // Gera HTML para a tabela de dados (se solicitado)
  let tabelaDadosHTML = '';
  if (imprimirTabela && dados.value.length > 0) {
    let headerHTML = headers.value.map(h => `<th style="background-color: #37474f; color: white; padding: 10px; text-align: left; border: 1px solid #ddd;">${h.title}</th>`).join('');
    
    let rowsHTML = dados.value.map(item => {
      let cells = headers.value.map(header => {
        let value = item[header.key] || '-';
        // Formatação básica
        if (header.key.includes('Peso') || header.key.includes('peso')) {
          value = parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        // Para bagTag, pegar apenas os últimos 6 números 
        if (header.key === 'bagTag' && value && value !== '-') {
          value = String(value).slice(-6);
        }
        return `<td style="padding: 8px; border: 1px solid #ddd;">${value}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    tabelaDadosHTML = `
      <div class="details-section" style="page-break-before: always;">
        <h3 style="color: #2e7d32; font-size: 16px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #4caf50;">Dados do Inventário</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr>${headerHTML}</tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    `;
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Resumo do Inventário<\/title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2e7d32;
          padding-bottom: 15px;
        }
        .header h1 {
          color: #2e7d32;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .header .info {
          color: #666;
          font-size: 12px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 25px;
        }
        .summary-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }
        .summary-card.blue { background: #e3f2fd; border-color: #90caf9; }
        .summary-card.green { background: #e8f5e9; border-color: #81c784; }
        .summary-card label {
          display: block;
          font-size: 11px;
          color: #666;
          margin-bottom: 5px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .summary-card .value {
          font-size: 18px;
          font-weight: bold;
          color: #212529;
        }
        .details-section {
          margin-top: 25px;
        }
        .details-section h3 {
          color: #2e7d32;
          font-size: 16px;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 2px solid #4caf50;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 13px;
        }
        table th {
          background-color: #2e7d32;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: 600;
        }
        table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 11px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Resumo do Inventário</h1>
        <div class="info">Impresso em: ${dataAtual} às ${horaAtual}</div>
      </div>

      <div class="summary-grid">
        <div class="summary-card blue">
          <label>Hora Início</label>
          <div class="value">${resumoInventario.value.horaInicio}</div>
        </div>
        <div class="summary-card blue">
          <label>Hora Fim</label>
          <div class="value">${resumoInventario.value.horaFim}</div>
        </div>
        <div class="summary-card green">
          <label>Total de Bags</label>
          <div class="value">${resumoInventario.value.totalBags}</div>
        </div>
        <div class="summary-card green">
          <label>Total de Sacas</label>
          <div class="value">${resumoInventario.value.totalSacas}</div>
        </div>
      </div>

      <div class="details-section">
        <h3>Bags por Hora</h3>
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th style="text-align: right;">Qtd</th>
              <th>Hora</th>
              <th style="text-align: right;">Qtd</th>
            </tr>
          </thead>
          <tbody>
            ${bagsPorHoraHTML}
          </tbody>
        </table>
      </div>

      <div class="details-section">
        <h3>Bags por Operador</h3>
        <table>
          <thead>
            <tr>
              <th>Operador</th>
              <th style="text-align: right;">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            ${bagsPorOperadorHTML}
          </tbody>
        </table>
      </div>

      ${tabelaDadosHTML}

      <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema OSTela</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      <\/script>
    <\/body>
    <\/html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Função para gerar headers dinâmicos baseados no labelMap da API
const gerarHeaders = (dadosArray, labelMap = []) => {
  if (!dadosArray || dadosArray.length === 0) return [];

  if (labelMap && Array.isArray(labelMap) && labelMap.length > 0) {
    return labelMap
      .filter(item => item.exibe === 'S')
      .map(item => ({
        title: item.label,
        key: item.key,
        align: 'start',
        sortable: true
      }));
  }

  const primeiroItem = dadosArray[0];
  return Object.keys(primeiroItem).map(key => ({
    title: key,
    key: key,
    align: 'start',
    sortable: true
  }));
};
</script>

<style scoped>
h1.titulo-pagina {
  color: #2e7d32;
  font-size: 1.5rem;
  margin: 0;
  text-align: center;
}

.container {
  min-width: 1300px;
}
/* Card principal */
.v-card {
  border-radius: 12px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
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

/* Seção de Resumo do Inventário */
.resumo-inventario {
  background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%);
  border: 2px solid #2e7d32 !important;
}

.resumo-titulo {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2e7d32;
  display: flex;
  align-items: center;
}

.resumo-card {
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border: 1px solid #e0e0e0;
  border-left: 3px solid #2e7d32;
  transition: all 0.3s ease;
}

.resumo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15) !important;
  border-left-color: #1b5e20;
}

.resumo-card-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.resumo-card-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2e7d32;
  line-height: 1.2;
}

.resumo-detalhes {
  font-size: 0.8rem;
  color: #424242;
}

.resumo-item {
  padding: 4px 8px;
  background: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 2px;
  transition: background 0.2s ease;
}

.resumo-item:hover {
  background: #e8f5e9;
}

.resumo-item span:first-child {
  color: #666;
}

.resumo-item span.font-weight-bold {
  color: #2e7d32;
}

/* Scrollbar customizada para o resumo */
.resumo-detalhes::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.resumo-detalhes::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.resumo-detalhes::-webkit-scrollbar-thumb {
  background: #a5d6a7;
  border-radius: 3px;
}

.resumo-detalhes::-webkit-scrollbar-thumb:hover {
  background: #81c784;
}

/* Estilo para impressão */
@media print {
  .resumo-inventario {
    page-break-inside: avoid;
    border: 2px solid #2e7d32 !important;
  }
}
</style>