<template>
  <v-dialog v-model="dialogVisible" max-width="1500px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-primary text-white d-flex align-center">
        <h4>Detalhes da Ordem de Serviço</h4>
        <v-spacer></v-spacer>
        <v-btn
          color="indigo"
          variant="elevated"
          @click="abrirImprimir"
          prepend-icon="mdi-printer"
          size="default"
          class="mr-2"
          :loading="loadingImprimir"
          :disabled="loadingImprimir"
        >
          Imprimir
        </v-btn>
        <v-btn
          color="blue-darken-2"
          variant="elevated"
          @click="abrirRelatorioMotoristas"
          prepend-icon="mdi-chart-box"
          size="default"
          class="mr-2"
        >
          Relatório Motoristas
        </v-btn>
        <v-btn
          color="green-darken-2"
          variant="elevated"
          @click="exportarExcel"
          prepend-icon="mdi-microsoft-excel"
          size="default"
          class="mr-2"
        >
          Exportar Excel
        </v-btn>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Seção de informações principais -->
        <v-card class="mb-4" elevation="2">
          <v-card-text class="pa-5">
            <!-- Primeira linha: OS/Ticket, Status, Total Peso -->
            <v-row class="mb-1">
              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="OS/Ticket"
                  :model-value="dadosModal.opTck || '-'"
                  readonly
                  variant="outlined"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="3" class="py-1">
                <v-row dense>
                  <v-col cols="6" class="pr-1">
                    <v-text-field
                      label="Status"
                      :model-value="dadosModal.itOSStatus || '-'"
                      readonly
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="6" class="pl-1">
                    <v-text-field
                      label="Prioridade"
                      :model-value="dadosModal.osprioridade || '-'"
                      readonly
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="Data"
                  v-model="dataEditavel"
                  variant="outlined"
                  density="compact"
                  @update:model-value="verificarAlteracaoDataHora"
                />
              </v-col>
              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="Hora"
                  v-model="horaEditavel"
                  variant="outlined"
                  density="compact"
                  @update:model-value="verificarAlteracaoDataHora"
                />
              </v-col>
            </v-row>
            
            <!-- Segunda linha: Data, Hora, Total Sacas -->
            <v-row>
              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="Total Peso"
                  :model-value="`${totalPeso.toFixed(2)} kg`"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="peso-field"
                />
              </v-col>

              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="Total Sacas"
                  :model-value="totalSacas.toFixed(2)"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="sacas-field"
                />
              </v-col>
              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="Quantidade atendida"
                  :model-value="totalSacasAtendidas.toFixed(2)"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="sacas-field"
                />
              </v-col>
              <v-col cols="12" md="3" class="py-1">
                <v-text-field
                  label="Quantidade restante"
                  :model-value="totalSacasRestantes.toFixed(2)"
                  readonly
                  variant="outlined"
                  density="compact"
                  class="sacas-field"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Tabela de detalhes -->
        <v-card elevation="2">
          <v-data-table
            :headers="headersDetalhes"
            :items="itensOrdenados"
            :loading="loading || loadingAtualizacao"
            class="data-table-detalhes"
            :items-per-page="300"
            v-model:sort-by="sortBy"
            fixed-header
            height="350px"
            hide-default-footer
          >
            <template v-slot:loading>
              <div class="loading-container">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
                <p class="mt-4 text-grey">Carregando detalhes...</p>
              </div>
            </template>

            <template v-slot:no-data>
              <div class="no-data-container">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-table-off</v-icon>
                <h3 class="text-grey-darken-1 mb-2">Nenhum item encontrado</h3>
              </div>
            </template>

            <!-- Formatação customizada das células -->
            <template v-slot:item="{ item }">
              <tr 
                :class="{ 'selected-row': isItemSelecionado(item) }"
                @click="toggleSelecionarItemTabela(item)"
                class="clickable-row"
              >
                <td class="text-center" @click.stop>
                  <v-checkbox
                    :model-value="isItemSelecionado(item)"
                    @update:modelValue="val => selecionarItemTabela(item, val)"
                    color="primary"
                  />
                </td>
                <td>{{ item.itOSItem }}</td>
                <td>
                  <span class="text-green-darken-2">
                    {{ formatarData(item.itOSData) }}
                  </span>
                </td>
                <td>
                  <span class="text-blue-darken-2">
                    {{ formatarHora(item.itOSHora) }}
                  </span>
                </td>
                <td>{{ item.lote }}</td>
                <td>
                  <span class="font-weight-bold text-blue-darken-2">
                    {{ formatarPeso(item.itOsPeso) }}
                  </span>
                </td>
                <td>{{ (item.itOsPeso/59).toFixed(2) }}</td>
                <td>{{ item.itOsTagBag.slice(-6) }}</td>
                <td>{{ item.itOsOrigem }}</td>
                <td>{{ item.itOsDestino }}</td>
                <td>{{ item.itOSStatus }}</td>
              </tr>
            </template>
          </v-data-table>
        </v-card>
      </v-card-text>

      <!-- Modais adicionais -->
      <!-- Modal Incluir Serviço -->
      <IncluirServico
        v-model="modalIncluir"
        :dados-ordem-servico="dadosModal"
        :dados-completos="dadosCompletos"
        @confirmar="onIncluirServico"
      />

      <!-- Modal Alterar Serviço -->
      <AlterarServico
        v-model="modalAlterar"
        :dados-ordem-servico="dadosModal"
        :dados-completos="dadosCompletos"
        :item-selecionado="itensSelecionadosTabela[0]"
        @confirmar="onAlterarConfirmado"
      />

      <!-- Modal Excluir Serviço -->
      <!--<ExcluirServico
        v-model="modalExcluir"
        :dados-ordem-servico="dadosModal"
        :dados-completos="dadosCompletos"
  :item-selecionado="itensSelecionadosTabela"
        @exclusao-concluida="onExclusaoConcluida"
        @erro-exclusao="onErroExclusao"
      />-->

      <!-- Modal Alterar Destino -->
      <AlterarDestino
        v-model="modalAlterarDestino"
        :dados-ordem-servico="dadosModal"
        :item-selecionado="itensSelecionadosTabela"
        @alteracao-concluida="onAlteracaoDestinoConcluida"
        @erro-alteracao="onErroAlteracaoDestino"
      />

      <!-- Modal Atender Item -->
      <AtenderItem
        v-model="modalAtenderItem"
  :item-selecionado="itensSelecionadosTabela[0]"
        @atendimento-concluido="onAtendimentoConcluido"
        @erro-atendimento="onErroAtendimento"
      />

      <!-- Modal Imprimir -->
      <Imprimir
        v-model="modalImprimir"
        :dados-completos="dadosLocais"
        :item-selecionado="dadosModal"
      />

      <!-- Modal Excluir Serviço -->
      <ExcluirServico
        v-model="modalExcluir"
        :dados-ordem-servico="dadosModal"
        :dados-completos="dadosLocais"
        :itens-selecionados="itensSelecionadosTabela"
        @confirmar="onExcluirConfirmado"
      />

      <!-- Modal Eliminar Resíduo -->
      <EliminarResiduo
        v-model="modalEliminarResiduo"
        :dados-ordem-servico="dadosModal"
        :dados-completos="dadosCompletos"
        :item-selecionado="itensSelecionadosTabela"
        @exclusao-concluida="onEliminarResiduoConcluida"
        @erro-exclusao="onErroEliminarResiduo"
      />

      <!-- Modal Seleção Tipo de Relatório -->
      <v-dialog v-model="modalSelecaoTipoRelatorio" max-width="400px" persistent>
        <v-card>
          <v-card-title class="pa-3 bg-primary text-white d-flex align-center">
            <h4>Tipo de Relatório</h4>
            <v-spacer></v-spacer>
            <v-btn icon variant="text" @click="modalSelecaoTipoRelatorio = false" size="small">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-6">
            <p class="text-h6 mb-4">Qual tipo de relatório deseja?</p>
            <v-btn
              color="primary"
              variant="elevated"
              @click="abrirRelatorioTipo('despejo')"
              block
              size="large"
              class="mb-3"
              prepend-icon="mdi-dump-truck"
            >
              Despejo (Moega)
            </v-btn>
            <v-btn
              color="secondary"
              variant="elevated"
              @click="abrirRelatorioTipo('embegadora')"
              block
              size="large"
              prepend-icon="mdi-package-variant"
            >
              Embegadora
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Modal Relatório Motoristas -->
      <RelatorioOS
        v-model="modalRelatorioMotoristas"
        :item-selecionado="dadosModalRelatorio"
      />

      <v-card-actions class="pa-3">
        <v-btn
          color="success"
          variant="elevated"
          @click="abrirIncluir"
          prepend-icon="mdi-plus"
          size="default"
          class="mr-2"
        >
          Incluir
        </v-btn>
        <v-btn
          color="warning"
          variant="elevated"
          @click="abrirAlterar"
          prepend-icon="mdi-pencil"
          size="default"
          class="mr-2"
          :disabled="itensSelecionadosTabela.length !== 1"
        >
          Alterar
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="abrirExcluir"
          prepend-icon="mdi-delete"
          size="default"
          class="mr-2"
          :disabled="itensSelecionadosTabela.length === 0"
        >
          Excluir
        </v-btn>
        <v-btn
          color="purple"
          variant="elevated"
          @click="abrirAlterarDestino"
          prepend-icon="mdi-map-marker"
          size="default"
          class="mr-2"
          :disabled="itensSelecionadosTabela.length === 0"
        >
          Alterar Destino
        </v-btn>
        <v-btn
          color="teal"
          variant="elevated"
          @click="abrirAtenderItem"
          prepend-icon="mdi-check-circle"
          size="default"
          class="mr-2"
          :disabled="itensSelecionadosTabela.length !== 1"
        >
          Atender Item
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          @click="abrirEliminarResiduo"
          prepend-icon="mdi-delete-alert"
          size="default"
          class="mr-2"
          :disabled="itensSelecionadosTabela.length === 0"
        >
          Eliminar resíduo
        </v-btn>
        <!-- Badge de alterações pendentes -->
        <v-badge
          v-if="alteracoesPendentes.length > 0"
          :content="alteracoesPendentes.length"
          color="error"
          class="mr-2"
        >
          <v-btn
            color="success"
            variant="elevated"
            @click="concluirAlteracoes"
            prepend-icon="mdi-content-save"
            size="default"
            :loading="loadingSalvar"
          >
            Concluir Alterações
          </v-btn>
        </v-badge>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="elevated"
          @click="fecharModal"
          prepend-icon="mdi-close"
          size="default"
        >
          Fechar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import IncluirServico from './incluirServico.vue';
import AlterarServico from './alterarServico.vue';
import ExcluirServico from './excluirServico.vue';
import EliminarResiduo from './eliminarResiduo.vue';
import AlterarDestino from './alterarDestino.vue';
import AtenderItem from './atenderItem.vue';
import Imprimir from './imprimir.vue';
import RelatorioOS from './relatórioOS.vue';
import { exportToExcel } from '@/utils/excelExport';
import { WMSOS } from '@/stores/Consultas/setWMSOS';
import { updEndOrigOE } from '@/stores/Consultas/updEndOrigOE';
import { getOE } from '@/stores/Consultas/getOE';

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
  },
  loading: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'atualizar-dados', 'dados-alterados']);

// Store
const wmSOSStore = WMSOS();
const updEndOrigOEStore = updEndOrigOE();
const OEStore = getOE();

// Data local
const dialogVisible = ref(props.modelValue);
const dadosModal = ref({});
const itensSelecionadosTabela = ref([]); // Itens selecionados na tabela para alteração
const loadingAtualizacao = ref(false); // Loading para atualização da tabela
const loadingSalvar = ref(false); // Loading para salvar alterações

// Campos editáveis do cabeçalho
const dataEditavel = ref('');
const horaEditavel = ref('');
const dataHoraAlterada = ref(false);

// Gerenciamento de alterações locais
const alteracoesPendentes = ref([]); // Array de alterações pendentes
const dadosLocais = ref([]); // Cópia local dos dados para exibição

// Estados dos modais
const modalIncluir = ref(false);
const modalAlterar = ref(false);
const modalExcluir = ref(false);
const modalEliminarResiduo = ref(false);
const modalAlterarDestino = ref(false);
const modalAtenderItem = ref(false);
const modalImprimir = ref(false);
const modalSelecaoTipoRelatorio = ref(false);
const modalRelatorioMotoristas = ref(false);
const dadosModalRelatorio = ref({});
const loadingImprimir = ref(false);

// Ordenação padrão da tabela: data+hora combinada (timestamp)
const sortBy = ref([{ key: 'dataHoraCombinada', order: 'asc' }]);

// Headers para a tabela de detalhes
const headersDetalhes = [
  {
    title: 'Selecionar',
    key: 'selecionar',
    align: 'center',
    sortable: false,
    width: '80px'
  },
  {
    title: 'Item',
    key: 'itOSItem',
    align: 'start',
    sortable: true
  },
  {
    title: 'Data',
    key: 'itOSData',
    align: 'start',
    sortable: true
  },
  {
    title: 'Hora',
    key: 'itOSHora',
    align: 'start',
    sortable: true
  },
  {
    title: 'Lote',
    key: 'lote',
    align: 'start',
    sortable: true 
  },
  {
    title: 'Peso',
    key: 'itOsPeso',
    align: 'start',
    sortable: true
  },
  {
    title: 'Sacas',
    key: 'sacasCalculadas',
    align: 'start',
    sortable: true
  },
  {
    title: 'Tag',
    key: 'tagOrdenavel',
    align: 'start',
    sortable: true
  },
  {
    title: 'Origem',
    key: 'itOsOrigem',
    align: 'start',
    sortable: true
  },
  {
    title: 'Destino',
    key: 'itOsDestino',
    align: 'start',
    sortable: true
  },
  {
    title: 'Status',
    key: 'itOSStatus',
    align: 'start',
    sortable: true
  }
];

// Watch para sincronizar o v-model
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal;
  if (newVal && props.itemSelecionado) {
    dadosModal.value = { ...props.itemSelecionado };
    inicializarDadosLocais();
    inicializarDataHora();
  }
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
  
  // Limpar seleção quando o modal for fechado
  if (!newVal) {
    itensSelecionadosTabela.value = [];
    alteracoesPendentes.value = [];
    dataHoraAlterada.value = false;
  }
});

// Watch para atualizar dados locais quando dadosCompletos mudar
watch(() => props.dadosCompletos, () => {
  if (dialogVisible.value) {
    inicializarDadosLocais();
  }
}, { deep: true });

// Computed para filtrar e ordenar itens pelo mesmo osid (agora usa dados locais)
const itensOrdenados = computed(() => {
  if (!props.itemSelecionado.osid || !dadosLocais.value.length) {
    return [];
  }

  // Filtra todos os itens com o mesmo osid
  const itensFiltrados = dadosLocais.value.filter(item => 
    item.osid === props.itemSelecionado.osid
  );

  // Adiciona campos computados para facilitar ordenação
  const itensComCamposComputados = itensFiltrados.map(item => {
    // Converte data (YYYYMMDD) e hora (HHMMSS) para timestamp
    const data = item.itOSData || '';
    const hora = item.itOSHora || '';
    
    // Cria um timestamp combinado para ordenação de data/hora
    let dataHoraCombinada = 0;
    if (data.length === 8) {
      const ano = parseInt(data.substring(0, 4)) || 0;
      const mes = parseInt(data.substring(4, 6)) || 0;
      const dia = parseInt(data.substring(6, 8)) || 0;
      
      let horas = 0, minutos = 0, segundos = 0;
      if (hora.length >= 4) {
        horas = parseInt(hora.substring(0, 2)) || 0;
        minutos = parseInt(hora.substring(2, 4)) || 0;
        if (hora.length >= 6) {
          segundos = parseInt(hora.substring(4, 6)) || 0;
        }
      }
      
      // Cria timestamp em milissegundos
      dataHoraCombinada = new Date(ano, mes - 1, dia, horas, minutos, segundos).getTime();
    }
    
    // Extrai apenas a hora para ordenação separada
    let horaOrdenavel = 0;
    if (hora.length >= 4) {
      horaOrdenavel = parseInt(hora.replace(/:/g, '')) || 0;
    }
    
    // Tag ordenável (converte para número se possível, senão mantém como string)
    const tag = item.itOsTagBag || '';
    const tagOrdenavel = tag.slice(-6); // Pega os últimos 6 caracteres
    
    // Calcula sacas para ordenação
    const sacasCalculadas = (parseFloat(item.itOsPeso) || 0) / 59;
    
    return {
      ...item,
      dataHoraCombinada,
      horaOrdenavel,
      tagOrdenavel,
      sacasCalculadas
    };
  });

  // Ordena por data+hora combinada (considera data e hora juntas)
  return itensComCamposComputados.sort((a, b) => {
    if (a.dataHoraCombinada !== b.dataHoraCombinada) {
      return a.dataHoraCombinada - b.dataHoraCombinada;
    }
    // Desempate pelo número do item
    const itemA = parseInt(a.itOSItem) || 0;
    const itemB = parseInt(b.itOSItem) || 0;
    return itemA - itemB;
  });
});

// Computed para calcular total do peso
const totalPeso = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    const peso = parseFloat(item.itOsPeso) || 0;
    return total + peso;
  }, 0);
});

// Computed para calcular total de sacas (peso / 59)
const totalSacas = computed(() => {
  return totalPeso.value / 59;
});

// Computed para calcular total atendida (apenas itens com status 'AT')
const totalAtendida = computed(() => {
  return itensOrdenados.value.reduce((total, item) => {
    if (item.itOSStatus === 'AT') {
      const peso = parseFloat(item.itOsPeso) || 0;
      return total + peso;
    }
    return total;
  }, 0);
});

// Computed para calcular total de sacas atendidas
const totalSacasAtendidas = computed(() => {
  return totalAtendida.value / 59;
});

// Computed para calcular total restante
const totalRestante = computed(() => {
  return totalPeso.value - totalAtendida.value;
});

// Computed para calcular total de sacas restantes
const totalSacasRestantes = computed(() => {
  return totalRestante.value / 59;
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

const inicializarDadosLocais = () => {
  dadosLocais.value = JSON.parse(JSON.stringify(props.dadosCompletos));
};

const inicializarDataHora = () => {
  dataEditavel.value = formatarData(dadosModal.value.osdata);
  horaEditavel.value = formatarHora(dadosModal.value.itOSHora);
  dataHoraAlterada.value = false;
};

const verificarAlteracaoDataHora = () => {
  const dataOriginal = formatarData(dadosModal.value.osdata);
  const horaOriginal = formatarHora(dadosModal.value.itOSHora);
  
  const houveAlteracao = (dataEditavel.value !== dataOriginal) || (horaEditavel.value !== horaOriginal);
  
  if (houveAlteracao && !dataHoraAlterada.value) {
    dataHoraAlterada.value = true;
    adicionarAlteracao('alterarDataHora', {
      data: dataEditavel.value,
      hora: horaEditavel.value
    });
  } else if (!houveAlteracao && dataHoraAlterada.value) {
    dataHoraAlterada.value = false;
    alteracoesPendentes.value = alteracoesPendentes.value.filter(alt => alt.tipo !== 'alterarDataHora');
  }
};

const adicionarAlteracao = (tipo, dados) => {
  alteracoesPendentes.value.push({
    tipo,
    dados,
    timestamp: new Date().toISOString()
  });
};

const aplicarAlteracaoLocal = (tipo, dados) => {
  switch (tipo) {
    case 'incluir':
      dados.forEach(item => {
        dadosLocais.value.push(item);
      });
      break;
      
    case 'alterar':
      const itensAlterar = Array.isArray(dados) ? dados : [dados];
      itensAlterar.forEach(itemAlteracao => {
        const indexAlterar = dadosLocais.value.findIndex(
          item => item.osid === itemAlteracao.osid && item.itOSItem === itemAlteracao.itOSItem
        );
        if (indexAlterar > -1) {
          dadosLocais.value[indexAlterar] = { ...dadosLocais.value[indexAlterar], ...itemAlteracao };
        }
      });
      break;
      
    case 'excluir':
      const indexExcluir = dadosLocais.value.findIndex(
        item => item.osid === dados.osid && item.itOSItem === dados.itOSItem
      );
      if (indexExcluir > -1) {
        dadosLocais.value.splice(indexExcluir, 1);
      }
      break;
      
    case 'alterarDestino':
      dados.itens.forEach(itemAlteracao => {
        const index = dadosLocais.value.findIndex(
          item => item.osid === itemAlteracao.osid && item.itOSItem === itemAlteracao.itOSItem
        );
        if (index > -1) {
          dadosLocais.value[index].itOsDestino = dados.novoDestino;
        }
      });
      break;
      
    case 'atender':
      const indexAtender = dadosLocais.value.findIndex(
        item => item.osid === dados.osid && item.itOSItem === dados.itOSItem
      );
      if (indexAtender > -1) {
        dadosLocais.value[indexAtender].itOSStatus = 'AT';
      }
      break;
      
    case 'eliminarResiduo':
      dados.forEach(itemEliminar => {
        const index = dadosLocais.value.findIndex(
          item => item.osid === itemEliminar.osid && item.itOSItem === itemEliminar.itOSItem
        );
        if (index > -1) {
          dadosLocais.value.splice(index, 1);
        }
      });
      break;
  }
};

const concluirAlteracoes = async () => {
  if (alteracoesPendentes.value.length === 0) {
    alert('Não há alterações pendentes para salvar.');
    return;
  }
  
  loadingSalvar.value = true;
  
  try {
    // 🔧 CORREÇÃO: Agora usa dadosLocais que contém TODAS as alterações acumuladas
    // ao invés de apenas a última alteração do todosItens
    const itensOS = dadosLocais.value.filter(item => 
      item.osid === props.itemSelecionado.osid
    );
    
    const itensFormatados = itensOS.map(item => {
      const numeroItem = parseInt(item.itOSItem) || 0;
      
      return {
        OSID: item.osid || "",
        ItOSItem: numeroItem.toString(),
        OpTck: item.opTck || props.itemSelecionado.opTck || "",
        EmpiCod: item.empiCod || "",
        MotCod: item.motCod || "",
        ItOSData: item.itOSData || "",
        ItOSHora: item.itOSHora || "",
        ItOsTagBag: item.itOsTagBag || "",
        ItOsOrigem: item.itOsOrigem || "",
        ItOsTagOrigem: item.itOsTagOrigem || "",
        ItOsDestino: item.itOsDestino || "",
        ItOsTagDestino: item.itOsTagDestino || "",
        ItOSStatus: item.itOSStatus || "",
        Lote: item.lote || "",
        ItOsObs: item.itOsObs || "",
        ItOsPeso: parseFloat(item.itOsPeso) || 0,
        ItOsPesoSoltar: parseFloat(item.itOsPesoSoltar) || 0
      };
    });
    
    console.log('📦 Itens formatados (TODAS as alterações acumuladas):');
    console.log('📊 Total de alterações pendentes:', alteracoesPendentes.value.length);
    console.log('📦 Total de itens a enviar:', itensFormatados.length);
    itensFormatados.forEach((item, index) => {
      console.log(`  Item ${item.ItOSItem}: Data=${item.ItOSData}, Hora=${item.ItOSHora}`);
    });
    
    const alteracaoDataHora = alteracoesPendentes.value.find(alt => alt.tipo === 'alterarDataHora');
    
    let osData = props.itemSelecionado.osdata || "";
    let osHora = props.itemSelecionado.oshora || "";
    
    if (alteracaoDataHora) {
      const dataEditada = alteracaoDataHora.dados.data;
      const horaEditada = alteracaoDataHora.dados.hora;
      
      if (dataEditada && dataEditada.includes('/')) {
        const partes = dataEditada.split('/');
        osData = `${partes[2]}${partes[1]}${partes[0]}`;
      } else {
        osData = dataEditada;
      }
      
      if (horaEditada && horaEditada.includes(':')) {
        osHora = horaEditada.replace(/:/g, '') + '00';
      } else {
        osHora = horaEditada;
      }
    }
    
    console.log('📅 Data/Hora do cabeçalho (wms_os):');
    console.log('  OSData:', osData, '(original:', props.itemSelecionado.osdata, ')');
    console.log('  OSHora:', osHora, '(original:', props.itemSelecionado.oshora, ')');
    console.log('  Alteração manual?', !!alteracaoDataHora);
    
    const dadosAPI = {
      wms_os: {
        OSID: props.itemSelecionado.osid || "",
        MotCod: "",
        OSOpTck: props.itemSelecionado.opTck || "",
        OSPrioridade: "0",
        OSBlocoSuger: "",
        OSData: osData,
        OSHora: osHora,
        OSStatus: "AT"
      },
      wms_itemos: itensFormatados
    };
    
    console.log('🚀 PAYLOAD FINAL ENVIADO PARA API:');
    console.log('📋 wms_os:', dadosAPI.wms_os);
    console.log('📦 wms_itemos (total:', itensFormatados.length, 'itens):');
    console.table(dadosAPI.wms_itemos);
    console.log('📄 JSON completo:', JSON.stringify(dadosAPI, null, 2));
    
    const response = await wmSOSStore.UPDWMSOS(dadosAPI);
    
    if (response && response.code === 600 && response.type === 'OK') {
      alert(`Alterações salvas com sucesso!\n\nTotal de itens: ${itensFormatados.length}\nAlterações aplicadas: ${alteracoesPendentes.value.length}`);
      
      if (alteracaoDataHora) {
        dadosModal.value.osdata = osData;
        dadosModal.value.itOSHora = osHora;
        dataEditavel.value = alteracaoDataHora.dados.data;
        horaEditavel.value = alteracaoDataHora.dados.hora;
        dataHoraAlterada.value = false;
      }
      
      alteracoesPendentes.value = [];
      
      emit('atualizar-dados');
      emit('dados-alterados');
    } else {
      throw new Error(response?.message || 'Erro ao salvar alterações');
    }
    
  } catch (error) {
    console.error('Erro ao salvar alterações:', error);
    alert(`Erro ao salvar alterações:\n${error.message}`);
  } finally {
    loadingSalvar.value = false;
  }
};

// Função para atualizar dados após operações
const atualizarDados = async () => {
  loadingAtualizacao.value = true;
  try {
    // Emite evento para o componente pai atualizar os dados
    emit('atualizar-dados');
    
    // Emite evento específico para indicar que dados foram alterados
    emit('dados-alterados');
    
    // Aguarda um tempo para simular carregamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Limpar seleção após atualização
    itensSelecionadosTabela.value = [];
  } finally {
    loadingAtualizacao.value = false;
  }
};

// Função para fechar o modal
const fecharModal = () => {
  // Limpar seleção da tabela
  itensSelecionadosTabela.value = [];
  
  dialogVisible.value = false;
};

// Funções para abrir os modais
const abrirIncluir = () => {
  modalIncluir.value = true;
};

const abrirAlterar = () => {
  modalAlterar.value = true;
};

const abrirExcluir = () => {
  if (itensSelecionadosTabela.value.length === 0) {
    alert('Por favor, selecione pelo menos um item para excluir.');
    return;
  }

  const itensAtendidos = itensSelecionadosTabela.value.filter(item => item.itOSStatus === 'AT');

  if (itensAtendidos.length > 0) {
    const itens = itensAtendidos.map(item => item.itOSItem).join(', ');
    alert(`Não é possível excluir item já atendido (AT).\n\nItem(ns): ${itens}`);
    return;
  }

  modalExcluir.value = true;
};

const abrirEliminarResiduo = () => {
  modalEliminarResiduo.value = true;
};

const abrirAlterarDestino = () => {
  modalAlterarDestino.value = true;
};

const abrirAtenderItem = () => {
  if (itensSelecionadosTabela.value.length === 0) {
    alert('Por favor, selecione um item para atender.');
    return;
  }
  modalAtenderItem.value = true;
};

const abrirImprimir = async () => {
  loadingImprimir.value = true;
  
  try {
    // Obtém o osid e opTck do item aberto
    const osid = dadosModal.value.osid || props.itemSelecionado.osid;
    const opTck = dadosModal.value.opTck || props.itemSelecionado.opTck;
    
    if (!osid || !opTck) {
      alert('Informações da OS não encontradas');
      return;
    }
    
    // Chama a API updEndOrigOE com o osid
    await updEndOrigOEStore.updEndOrigOE({ osid });
    
    // Busca os dados atualizados da API
    console.log('Buscando dados atualizados para impressão - OS:', opTck);
    const params = {
      dataIni: '',
      dataFim: '',
      optck: opTck,
      tagBag: '',
      status: '', // Status vazio para trazer todos os itens
      salto: "0",
      regPPagina: "9999"
    };

    const response = await OEStore.getOE(params);
    console.log('Dados atualizados recebidos:', response);
    
    // Processa a resposta para atualizar dadosLocais
    let dadosAtualizados = [];
    if (Array.isArray(response)) {
      dadosAtualizados = response;
    } else if (response && Array.isArray(response.data)) {
      dadosAtualizados = response.data;
    } else if (response && Array.isArray(response.listOE)) {
      dadosAtualizados = response.listOE;
    }

    // Atualiza os dados locais com os dados frescos da API
    if (dadosAtualizados.length > 0) {
      dadosLocais.value = JSON.parse(JSON.stringify(dadosAtualizados));
      console.log('Dados locais atualizados para impressão. Total de itens:', dadosLocais.value.length);
    } else {
      console.warn('Nenhum dado atualizado recebido da API');
    }
    
    // Abre o modal de impressão
    modalImprimir.value = true;
  } catch (error) {
    console.error('Erro ao preparar impressão:', error);
    alert('Erro ao preparar impressão: ' + error.message);
  } finally {
    loadingImprimir.value = false;
  }
};

const abrirRelatorioMotoristas = () => {
  modalSelecaoTipoRelatorio.value = true;
};

const abrirRelatorioTipo = (tipo) => {
  // Fecha o modal de seleção
  modalSelecaoTipoRelatorio.value = false;
  
  // Filtra os itens baseado no tipo
  const itensFiltrados = itensOrdenados.value.filter(item => {
    const destino = item.itOsDestino || '';
    
    if (tipo === 'despejo') {
      // Despejo: itOsDestino começa com 'M' (moega)
      return destino.toUpperCase().startsWith('M');
    } else {
      // Embegadora: todo o resto (não começa com 'M')
      return !destino.toUpperCase().startsWith('M');
    }
  });
  
  // Verifica se há itens para o tipo selecionado
  if (itensFiltrados.length === 0) {
    alert(`Não há itens do tipo ${tipo === 'despejo' ? 'Despejo (Moega)' : 'Embegadora'} nesta ordem de serviço.`);
    return;
  }
  
  // Prepara os dados para o relatório com os itens filtrados
  dadosModalRelatorio.value = {
    ...dadosModal.value,
    tipoRelatorio: tipo,
    itensFiltrados: itensFiltrados
  };
  
  // Abre o modal de relatório
  modalRelatorioMotoristas.value = true;
};

// Função para selecionar item na tabela
// Função para selecionar/desselecionar itens na tabela
const getItemSelecaoKey = (item) => `${item?.osid || ''}-${item?.itOSItem || ''}`;

const isItemSelecionado = (item) => {
  const itemKey = getItemSelecaoKey(item);
  return itensSelecionadosTabela.value.some(itemSelecionado => 
    getItemSelecaoKey(itemSelecionado) === itemKey
  );
};

const selecionarItemTabela = (item, checked) => {
  const itemKey = getItemSelecaoKey(item);

  if (checked) {
    if (!isItemSelecionado(item)) {
      itensSelecionadosTabela.value.push(item);
    }
  } else {
    itensSelecionadosTabela.value = itensSelecionadosTabela.value.filter(
      itemSelecionado => getItemSelecaoKey(itemSelecionado) !== itemKey
    );
  }
};

// Função para alternar seleção ao clicar na linha
const toggleSelecionarItemTabela = (item) => {
  const isSelected = isItemSelecionado(item);
  selecionarItemTabela(item, !isSelected);
};

const onIncluirServico = (dadosServico) => {
  if (dadosServico && dadosServico.novosItens && Array.isArray(dadosServico.novosItens)) {
    adicionarAlteracao('incluir', {
      novosItens: dadosServico.novosItens,
      todosItens: dadosServico.todosItens
    });
    
    aplicarAlteracaoLocal('incluir', dadosServico.novosItens);
  }
  
  modalIncluir.value = false;
  itensSelecionadosTabela.value = [];
};

const onAlterarConfirmado = (dadosServico) => {
  if (dadosServico && dadosServico.itensAlterados && Array.isArray(dadosServico.itensAlterados)) {
    adicionarAlteracao('alterar', {
      itensAlterados: dadosServico.itensAlterados,
      todosItens: dadosServico.todosItens
    });
    
    dadosServico.itensAlterados.forEach(itemAlterado => {
      aplicarAlteracaoLocal('alterar', itemAlterado);
    });
  }
  
  modalAlterar.value = false;
  itensSelecionadosTabela.value = [];
};

const onExcluirConfirmado = (dadosServico) => {
  if (dadosServico && dadosServico.itensExcluidos && Array.isArray(dadosServico.itensExcluidos)) {
    adicionarAlteracao('excluir', {
      itensExcluidos: dadosServico.itensExcluidos,
      todosItens: dadosServico.todosItens
    });
    
    dadosServico.itensExcluidos.forEach(itemExcluido => {
      aplicarAlteracaoLocal('excluir', itemExcluido);
    });
  }
  
  modalExcluir.value = false;
  itensSelecionadosTabela.value = [];
};

const onEliminarResiduoConcluida = (resultado) => {
  console.log('Eliminação de resíduo concluída:', resultado);
  
  alert(`${resultado.sucessos} item(ns) eliminado(s) com sucesso!`);
  
  // Fechar o modal de eliminação
  modalEliminarResiduo.value = false;
  itensSelecionadosTabela.value = [];
  atualizarDados();
};

const onErroEliminarResiduo = (resultado) => {
  console.error('Erro na eliminação de resíduo:', resultado);
  
  const mensagem = resultado.erroGeral 
    ? `Erro geral: ${resultado.erroGeral}`
    : `${resultado.sucessos} sucessos, ${resultado.erros} erros na eliminação`;
    
  alert(`Erro na eliminação: ${mensagem}`);
  itensSelecionadosTabela.value = [];
};

const onAlteracaoDestinoConcluida = () => {
  alert(`Destino alterado com sucesso!`);
  modalAlterarDestino.value = false;
  itensSelecionadosTabela.value = [];
  atualizarDados();
};

const onErroAlteracaoDestino = (resultado) => {
  console.error('Erro na alteração de destino:', resultado);
  
  const mensagem = resultado.erro || 'Erro desconhecido ao alterar destino';
  alert(`Erro ao alterar destino: ${mensagem}`);
  itensSelecionadosTabela.value = [];
};

const onAtendimentoConcluido = (resultado) => {
  const tipoMovimentacao = resultado.tipo === 'corte' ? 'Corte' : 'Movimentação';
  alert(`${tipoMovimentacao} realizada com sucesso na posição: ${resultado.posicao}`);
  
  modalAtenderItem.value = false;
  itensSelecionadosTabela.value = [];
  atualizarDados();
};

const onErroAtendimento = (resultado) => {
  console.error('Erro no atendimento:', resultado);
  
  const mensagem = resultado.erro || 'Erro desconhecido ao realizar atendimento';
  alert(`Erro no atendimento: ${mensagem}`);
  itensSelecionadosTabela.value = [];
};

const exportarExcel = () => {
  const itens = itensOrdenados.value;
  
  if (!itens.length) {
    alert('Não há itens para exportar.');
    return;
  }

  const headers = [
    { title: 'Item',    key: 'itOSItem' },
    { title: 'Data',    key: '_dataFmt' },
    { title: 'Hora',    key: '_horaFmt' },
    { title: 'Lote',    key: 'lote' },
    { title: 'Peso',    key: '_pesoFmt' },
    { title: 'Sacas',   key: '_sacasFmt' },
    { title: 'Tag',     key: 'tagOrdenavel' },
    { title: 'Origem',  key: 'itOsOrigem' },
    { title: 'Destino', key: 'itOsDestino' },
    { title: 'Status',  key: 'itOSStatus' }
  ];

  const data = itens.map(item => ({
    ...item,
    _dataFmt:  formatarData(item.itOSData),
    _horaFmt:  formatarHora(item.itOSHora),
    _pesoFmt:  formatarPeso(item.itOsPeso),
    _sacasFmt: (parseFloat(item.itOsPeso) / 59).toFixed(2)
  }));

  const os = dadosModal.value.opTck || props.itemSelecionado.opTck || 'OS';
  exportToExcel([{ name: 'Lotes', data, headers }], `Lotes_${os}`);
};
</script>

<style scoped>
/* Customização da tabela de detalhes */
.data-table-detalhes {
  max-height: 350px;
  overflow-y: auto;
}

.data-table-detalhes :deep(.v-data-table__wrapper) {
  max-height: 300px;
}

.data-table-detalhes :deep(.v-data-table-header th) {
  background-color: #37474f !important;
  color: white !important;
  font-weight: 600;
  border-bottom: 2px solid #263238;
  font-size: 0.85rem !important;
  padding: 8px 12px !important;
}

.data-table-detalhes :deep(.v-data-table-header th .v-data-table-header__content) {
  color: white;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table-detalhes :deep(.v-data-table__td) {
  font-size: 0.85rem !important;
  padding: 6px 12px !important;
}

/* Estilo para campos de totais */
.peso-field :deep(.v-field__input) {
  font-weight: bold;
  color: #1976d2;
}

.sacas-field :deep(.v-field__input) {
  font-weight: bold;
  color: #388e3c;
}

/* Estados de loading e sem dados */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.no-data-container {
  text-align: center;
  padding: 60px 20px;
}

/* Linha selecionada na tabela */
.selected-row {
  background-color: #e3f2fd !important;
}

.selected-row:hover {
  background-color: #bbdefb !important;
}

/* Linha clicável */
.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: #f5f5f5 !important;
}

.clickable-row.selected-row:hover {
  background-color: #bbdefb !important;
}

/* Card de contadores */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
}

/* Responsividade */
@media (max-width: 768px) {
  .data-table-detalhes {
    font-size: 0.85rem;
  }
}
</style>
