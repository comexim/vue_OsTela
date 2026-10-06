<template>
  <v-dialog v-model="dialogVisible" max-width="1200px" persistent>
    <v-card>
      <v-card-title class="pa-1 bg-primary text-white d-flex align-center">
        <h4>
          Relatório de Motoristas 
          <span v-if="props.itemSelecionado.tipoRelatorio" class="ml-2">
            - {{ props.itemSelecionado.tipoRelatorio === 'despejo' ? 'Despejo (Moega)' : 'Embegadora' }}
          </span>
        </h4>
        <v-spacer></v-spacer>
        <v-btn icon variant="text" @click="fecharModal" size="small">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <!-- Loading -->
        <div v-if="loading" class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4">Carregando dados dos motoristas...</p>
        </div>

        <!-- Conteúdo -->
        <div v-else-if="dadosMotoristas && dadosMotoristas.length > 0">
          <!-- Card de resumo -->
          <v-card class="mb-4" elevation="2">
            <v-card-text class="pa-3">
              <v-row>
                <v-col cols="12" md="3">
                  <div class="info-box">
                    <div class="info-label">Total de Motoristas</div>
                    <div class="info-value">{{ dadosMotoristas.length }}</div>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="info-box">
                    <div class="info-label">Total de Bags</div>
                    <div class="info-value">{{ totalGeralBags }}</div>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="info-box">
                    <div class="info-label">Média Bags/Hora</div>
                    <div class="info-value">{{ mediaGeralBagsPorHora }}</div>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="info-box">
                    <div class="info-label">Tempo Total da OS</div>
                    <div class="info-value">{{ tempoTotalOS }}</div>
                  </div>
                </v-col>
              </v-row>
              <v-row class="mt-2">
                <v-col cols="12" md="3">
                  <div class="info-box cortes">
                    <div class="info-label">Número de Cortes</div>
                    <div class="info-value">{{ numeroCortes }}</div>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="info-box cortes">
                    <div class="info-label">Tempo de Cortes</div>
                    <div class="info-value">{{ tempoCortes }}</div>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="info-box inicio">
                    <div class="info-label">Início da OS</div>
                    <div class="info-value-small">{{ dataHoraInicio }}</div>
                  </div>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="info-box fim">
                    <div class="info-label">Fim da OS</div>
                    <div class="info-value-small">{{ dataHoraFim }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Lista de motoristas com expansão -->
          <v-expansion-panels v-model="painelExpandido" multiple>
            <v-expansion-panel
              v-for="(motorista, index) in dadosMotoristas"
              :key="index"
              class="mb-2"
            >
              <v-expansion-panel-title class="motorista-header">
                <v-row no-gutters align="center">
                  <v-col cols="12" md="3">
                    <div class="motorista-nome">
                      <v-icon class="mr-2">mdi-account</v-icon>
                      <strong>{{ motorista.motCod }}</strong>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="motorista-info">
                      <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                      <span>{{ calcularTempoTotalMotorista(motorista) }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="motorista-info">
                      <v-icon size="small" class="mr-1">mdi-package-variant</v-icon>
                      <span>{{ motorista.quantidadeBags }} bags</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="3">
                    <div class="motorista-info">
                      <v-icon size="small" class="mr-1">mdi-speedometer</v-icon>
                      <span>{{ calcularBagsPorHoraMotorista(motorista) }} bags/h</span>
                    </div>
                  </v-col>
                </v-row>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <v-card elevation="0" class="mt-2">
                  <v-card-title class="text-subtitle-1 pa-2 bg-grey-lighten-4">
                    Detalhamento de Bags
                  </v-card-title>
                  <v-card-text class="pa-0">
                    <v-data-table
                      :headers="headersBags"
                      :items="motorista.bagsDetalhados"
                      :items-per-page="-1"
                      density="compact"
                      class="bags-table"
                      hide-default-footer
                    >
                      <template v-slot:[`item.bagTag`]="{ item }">
                        <span class="tag-badge">{{ formatarTag(item.bagTag) }}</span>
                      </template>
                      <template v-slot:[`item.data`]="{ item }">
                        {{ formatarData(item.data) }}
                      </template>
                      <template v-slot:[`item.horaInicio`]="{ item }">
                        {{ item.horaInicio }}
                      </template>
                      <template v-slot:[`item.horaFim`]="{ item }">
                        {{ item.horaFim }}
                      </template>
                      <template v-slot:[`item.duracao`]="{ item }">
                        {{ calcularDuracao(item.horaInicio, item.horaFim) }}
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <!-- Sem dados -->
        <div v-else class="no-data-container">
          <v-icon size="64" color="grey">mdi-alert-circle-outline</v-icon>
          <p class="mt-4">Nenhum dado de motorista encontrado para esta ordem de serviço.</p>
        </div>
      </v-card-text>

      <v-card-actions class="pa-3">
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
import { useTempoMotorista } from '../../../stores/Consultas/getTempoMotorista';

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  itemSelecionado: {
    type: Object,
    default: () => ({})
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Estado
const dialogVisible = ref(props.modelValue);
const loading = ref(false);
const dadosMotoristas = ref([]);
const dadosCortes = ref([]);
const painelExpandido = ref([]);

// Store
const tempoMotoristaStore = useTempoMotorista();

// Headers para tabela de bags
const headersBags = [
  {
    title: 'Tag',
    key: 'bagTag',
    align: 'start',
    sortable: true
  },
  {
    title: 'Data',
    key: 'data',
    align: 'start',
    sortable: true
  },
  {
    title: 'Hora Início',
    key: 'horaInicio',
    align: 'start',
    sortable: true
  },
  {
    title: 'Hora Fim',
    key: 'horaFim',
    align: 'start',
    sortable: true
  },
  {
    title: 'Duração',
    key: 'duracao',
    align: 'start',
    sortable: false
  }
];

// Watchers
watch(() => props.modelValue, async (newVal) => {
  dialogVisible.value = newVal;
  if (newVal) {
    await carregarDados();
  }
});

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal);
  if (!newVal) {
    // Limpar dados ao fechar
    dadosMotoristas.value = [];
    dadosCortes.value = [];
    painelExpandido.value = [];
  }
});

// Computed
const totalGeralBags = computed(() => {
  return dadosMotoristas.value.reduce((total, motorista) => {
    return total + (motorista.quantidadeBags || 0);
  }, 0);
});

const mediaGeralBagsPorHora = computed(() => {
  if (dadosMotoristas.value.length === 0 || totalGeralBags.value === 0) return '0';
  
  // Encontra a primeira e última data/hora da OS
  let primeiraData = null;
  let primeiraHora = null;
  let ultimaData = null;
  let ultimaHora = null;

  dadosMotoristas.value.forEach(motorista => {
    if (motorista.bagsDetalhados && motorista.bagsDetalhados.length > 0) {
      motorista.bagsDetalhados.forEach(bag => {
        // Início
        if (bag.data && bag.horaInicio) {
          const dataAtual = bag.data;
          const horaAtual = bag.horaInicio;
          if (!primeiraData || !primeiraHora) {
            primeiraData = dataAtual;
            primeiraHora = horaAtual;
          } else {
            const dataAtualInt = parseInt(dataAtual);
            const primeiraDataInt = parseInt(primeiraData);
            if (dataAtualInt < primeiraDataInt) {
              primeiraData = dataAtual;
              primeiraHora = horaAtual;
            } else if (dataAtualInt === primeiraDataInt) {
              if (horaAtual < primeiraHora) {
                primeiraHora = horaAtual;
              }
            }
          }
        }
        // Fim
        if (bag.data && bag.horaFim) {
          const dataAtual = bag.data;
          const horaAtual = bag.horaFim;
          if (!ultimaData || !ultimaHora) {
            ultimaData = dataAtual;
            ultimaHora = horaAtual;
          } else {
            const dataAtualInt = parseInt(dataAtual);
            const ultimaDataInt = parseInt(ultimaData);
            if (dataAtualInt > ultimaDataInt) {
              ultimaData = dataAtual;
              ultimaHora = horaAtual;
            } else if (dataAtualInt === ultimaDataInt) {
              if (horaAtual > ultimaHora) {
                ultimaHora = horaAtual;
              }
            }
          }
        }
      });
    }
  });

  if (!primeiraData || !primeiraHora || !ultimaData || !ultimaHora) return '0';

  // Cria objetos Date com data e hora completas
  const [horaIni, minutoIni] = primeiraHora.split(':').map(Number);
  const [horaFim, minutoFim] = ultimaHora.split(':').map(Number);
  
  const dateStart = new Date(
    parseInt(primeiraData.substring(0, 4)),
    parseInt(primeiraData.substring(4, 6)) - 1,
    parseInt(primeiraData.substring(6, 8)),
    horaIni,
    minutoIni
  );
  
  const dateEnd = new Date(
    parseInt(ultimaData.substring(0, 4)),
    parseInt(ultimaData.substring(4, 6)) - 1,
    parseInt(ultimaData.substring(6, 8)),
    horaFim,
    minutoFim
  );
  
  // Calcula a diferença em minutos
  const diffMs = dateEnd - dateStart;
  const totalMinutos = diffMs / (1000 * 60);
  
  // Se não houver bags, retorna 0
  if (totalGeralBags.value === 0) return '0';
  
  // Calcula: Tempo Total da OS (em minutos) ÷ Total de Bags
  const mediaTempoPorBag = totalMinutos / totalGeralBags.value;
  
  return mediaTempoPorBag.toFixed(1);
});

// Tempo total da OS (do início ao fim da OS)
const tempoTotalOS = computed(() => {
  if (!dadosMotoristas.value || dadosMotoristas.value.length === 0) return '00:00';

  // Encontra a primeira data/hora de início
  let primeiraData = null;
  let primeiraHora = null;
  let ultimaData = null;
  let ultimaHora = null;

  dadosMotoristas.value.forEach(motorista => {
    if (motorista.bagsDetalhados && motorista.bagsDetalhados.length > 0) {
      motorista.bagsDetalhados.forEach(bag => {
        // Início
        if (bag.data && bag.horaInicio) {
          const dataAtual = bag.data;
          const horaAtual = bag.horaInicio;
          if (!primeiraData || !primeiraHora) {
            primeiraData = dataAtual;
            primeiraHora = horaAtual;
          } else {
            const dataAtualInt = parseInt(dataAtual);
            const primeiraDataInt = parseInt(primeiraData);
            if (dataAtualInt < primeiraDataInt) {
              primeiraData = dataAtual;
              primeiraHora = horaAtual;
            } else if (dataAtualInt === primeiraDataInt) {
              if (horaAtual < primeiraHora) {
                primeiraHora = horaAtual;
              }
            }
          }
        }
        // Fim
        if (bag.data && bag.horaFim) {
          const dataAtual = bag.data;
          const horaAtual = bag.horaFim;
          if (!ultimaData || !ultimaHora) {
            ultimaData = dataAtual;
            ultimaHora = horaAtual;
          } else {
            const dataAtualInt = parseInt(dataAtual);
            const ultimaDataInt = parseInt(ultimaData);
            if (dataAtualInt > ultimaDataInt) {
              ultimaData = dataAtual;
              ultimaHora = horaAtual;
            } else if (dataAtualInt === ultimaDataInt) {
              if (horaAtual > ultimaHora) {
                ultimaHora = horaAtual;
              }
            }
          }
        }
      });
    }
  });

  if (!primeiraData || !primeiraHora || !ultimaData || !ultimaHora) return '00:00';

  // Calcula minutos entre início e fim usando objetos Date completos
  const dataInicioInt = parseInt(primeiraData);
  const dataFimInt = parseInt(ultimaData);
  
  // Cria objetos Date com data e hora completas
  const [horaIni, minutoIni] = primeiraHora.split(':').map(Number);
  const [horaFim, minutoFim] = ultimaHora.split(':').map(Number);
  
  const dateStart = new Date(
    parseInt(primeiraData.substring(0, 4)),
    parseInt(primeiraData.substring(4, 6)) - 1,
    parseInt(primeiraData.substring(6, 8)),
    horaIni,
    minutoIni
  );
  
  const dateEnd = new Date(
    parseInt(ultimaData.substring(0, 4)),
    parseInt(ultimaData.substring(4, 6)) - 1,
    parseInt(ultimaData.substring(6, 8)),
    horaFim,
    minutoFim
  );
  
  // Calcula a diferença em minutos
  const diffMs = dateEnd - dateStart;
  const minutosTotal = Math.floor(diffMs / (1000 * 60));

  const horas = Math.floor(minutosTotal / 60);
  const minutos = minutosTotal % 60;
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
});

// Número de cortes
const numeroCortes = computed(() => {
  if (!dadosCortes.value || dadosCortes.value.length === 0) return 0;
  return dadosCortes.value.reduce((total, corte) => {
    return total + (corte.quantidadeBags || 0);
  }, 0);
});

// Tempo total de cortes
const tempoCortes = computed(() => {
  if (!dadosCortes.value || dadosCortes.value.length === 0) return '00:00';
  
  let totalMinutos = 0;
  
  dadosCortes.value.forEach(corte => {
    if (corte.totalHoras) {
      const [horas, minutos] = corte.totalHoras.split(':').map(Number);
      totalMinutos += (horas * 60) + minutos;
    }
  });
  
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
});

// Data/Hora de início da OS (primeira hora de qualquer motorista)
const dataHoraInicio = computed(() => {
  if (!dadosMotoristas.value || dadosMotoristas.value.length === 0) return '-';
  
  let primeiraData = null;
  let primeiraHora = null;
  
  dadosMotoristas.value.forEach(motorista => {
    if (motorista.bagsDetalhados && motorista.bagsDetalhados.length > 0) {
      motorista.bagsDetalhados.forEach(bag => {
        if (bag.data && bag.horaInicio) {
          const dataAtual = bag.data;
          const horaAtual = bag.horaInicio;
          
          // Se não temos primeira data/hora ainda, define
          if (!primeiraData || !primeiraHora) {
            primeiraData = dataAtual;
            primeiraHora = horaAtual;
          } else {
            // Compara datas e horas para encontrar a mais antiga
            const dataAtualInt = parseInt(dataAtual);
            const primeiraDataInt = parseInt(primeiraData);
            
            if (dataAtualInt < primeiraDataInt) {
              primeiraData = dataAtual;
              primeiraHora = horaAtual;
            } else if (dataAtualInt === primeiraDataInt) {
              // Mesma data, compara horas
              if (horaAtual < primeiraHora) {
                primeiraHora = horaAtual;
              }
            }
          }
        }
      });
    }
  });
  
  if (!primeiraData || !primeiraHora) return '-';
  
  return `${formatarData(primeiraData)} ${primeiraHora}`;
});

// Data/Hora de fim da OS (última hora de qualquer motorista)
const dataHoraFim = computed(() => {
  if (!dadosMotoristas.value || dadosMotoristas.value.length === 0) return '-';
  
  let ultimaData = null;
  let ultimaHora = null;
  
  dadosMotoristas.value.forEach(motorista => {
    if (motorista.bagsDetalhados && motorista.bagsDetalhados.length > 0) {
      motorista.bagsDetalhados.forEach(bag => {
        if (bag.data && bag.horaFim) {
          const dataAtual = bag.data;
          const horaAtual = bag.horaFim;
          
          // Se não temos última data/hora ainda, define
          if (!ultimaData || !ultimaHora) {
            ultimaData = dataAtual;
            ultimaHora = horaAtual;
          } else {
            // Compara datas e horas para encontrar a mais recente
            const dataAtualInt = parseInt(dataAtual);
            const ultimaDataInt = parseInt(ultimaData);
            
            if (dataAtualInt > ultimaDataInt) {
              ultimaData = dataAtual;
              ultimaHora = horaAtual;
            } else if (dataAtualInt === ultimaDataInt) {
              // Mesma data, compara horas
              if (horaAtual > ultimaHora) {
                ultimaHora = horaAtual;
              }
            }
          }
        }
      });
    }
  });
  
  if (!ultimaData || !ultimaHora) return '-';
  
  return `${formatarData(ultimaData)} ${ultimaHora}`;
});

// Métodos
const carregarDados = async () => {
  if (!props.itemSelecionado || !props.itemSelecionado.opTck) {
    console.warn('Nenhuma OS selecionada ou opTck não encontrado');
    return;
  }

  loading.value = true;
  try {
    console.log('Carregando dados para OS:', props.itemSelecionado.opTck);
    console.log('Tipo de relatório:', props.itemSelecionado.tipoRelatorio);
    console.log('Itens filtrados:', props.itemSelecionado.itensFiltrados);
    
    // Chama a API com o opTck
    const response = await tempoMotoristaStore.getTempoMotorista({
      optck: props.itemSelecionado.opTck,
      osid: props.itemSelecionado.osid
    });

    console.log('Resposta da API:', response);

    if (response && typeof response === 'object') {
      let motoristas = [];
      
      // Verifica se há motoristas na resposta
      if (response.motoristas && Array.isArray(response.motoristas)) {
        motoristas = response.motoristas;
      } else if (Array.isArray(response)) {
        // Fallback para o formato antigo
        motoristas = response;
      }
      
      // Se houver itens filtrados, filtrar os bags dos motoristas
      if (props.itemSelecionado.itensFiltrados && props.itemSelecionado.itensFiltrados.length > 0) {
        console.log('Aplicando filtro nos bags dos motoristas...');
        
        // Cria um Set com as tags dos itens filtrados para busca rápida
        const tagsPermitidas = new Set(
          props.itemSelecionado.itensFiltrados.map(item => item.itOsTagBag)
        );
        
        console.log('Tags permitidas:', Array.from(tagsPermitidas));
        
        // Filtra os bags de cada motorista
        motoristas = motoristas.map(motorista => {
          const bagsFiltered = motorista.bagsDetalhados.filter(bag => 
            tagsPermitidas.has(bag.bagTag)
          );
          
          return {
            ...motorista,
            bagsDetalhados: bagsFiltered,
            quantidadeBags: bagsFiltered.length
          };
        }).filter(motorista => motorista.quantidadeBags > 0); // Remove motoristas sem bags
        
        console.log('Motoristas após filtro:', motoristas.length);
      }
      
      dadosMotoristas.value = motoristas;
      console.log('Motoristas carregados:', dadosMotoristas.value.length);

      // Verifica se há cortes na resposta
      if (response.cortes && Array.isArray(response.cortes)) {
        dadosCortes.value = response.cortes;
        console.log('Cortes carregados:', dadosCortes.value.length);
        console.log('Dados dos cortes:', dadosCortes.value);
      } else {
        dadosCortes.value = [];
      }
    } else if (response && response.success === false) {
      console.error('Erro na API:', response.message);
      dadosMotoristas.value = [];
      dadosCortes.value = [];
    } else {
      dadosMotoristas.value = [];
      dadosCortes.value = [];
    }
  } catch (error) {
    console.error('Erro ao carregar dados dos motoristas:', error);
    dadosMotoristas.value = [];
    dadosCortes.value = [];
  } finally {
    loading.value = false;
  }
};

const formatarTag = (tag) => {
  if (!tag) return '-';
  // Retorna os últimos 6 dígitos
  return tag.slice(-6);
};

const formatarData = (data) => {
  if (!data) return '-';
  if (typeof data === 'string' && data.length === 8 && /^\d{8}$/.test(data)) {
    const year = data.substring(0, 4);
    const month = data.substring(4, 6);
    const day = data.substring(6, 8);
    return `${day}/${month}/${year}`;
  }
  return data;
};

const calcularDuracao = (horaInicio, horaFim) => {
  const minutos = calcularDuracaoEmMinutos(horaInicio, horaFim);
  if (minutos < 0) return '-';
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const calcularDuracaoEmMinutos = (horaInicio, horaFim) => {
  if (!horaInicio || !horaFim) return 0;
  
  try {
    // Converte as horas para minutos
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFim, mFim] = horaFim.split(':').map(Number);
    
    const minutosInicio = hIni * 60 + mIni;
    const minutosFim = hFim * 60 + mFim;
    
    let diferencaMinutos = minutosFim - minutosInicio;
    
    // Se a diferença for negativa, assumir que passou da meia-noite
    if (diferencaMinutos < 0) {
      diferencaMinutos += 24 * 60;
    }
    
    // Se a diferença for 0, considerar como 1 minuto mínimo
    if (diferencaMinutos === 0) {
      diferencaMinutos = 1;
    }
    
    return diferencaMinutos;
  } catch (error) {
    console.error('Erro ao calcular duração:', error);
    return 0;
  }
};

const calcularTempoTotalMotorista = (motorista) => {
  if (!motorista.bagsDetalhados || motorista.bagsDetalhados.length === 0) return '00:00';
  
  let totalMinutos = 0;
  motorista.bagsDetalhados.forEach(bag => {
    totalMinutos += calcularDuracaoEmMinutos(bag.horaInicio, bag.horaFim);
  });
  
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
};

const calcularBagsPorHoraMotorista = (motorista) => {
  if (!motorista.bagsDetalhados || motorista.bagsDetalhados.length === 0) return '0';
  
  let totalMinutos = 0;
  motorista.bagsDetalhados.forEach(bag => {
    totalMinutos += calcularDuracaoEmMinutos(bag.horaInicio, bag.horaFim);
  });
  
  if (totalMinutos === 0) return '0';
  
  const totalHoras = totalMinutos / 60;
  const bagsPorHora = motorista.quantidadeBags / totalHoras;
  
  return bagsPorHora.toFixed(1);
};

const fecharModal = () => {
  dialogVisible.value = false;
};
</script>

<style scoped>
.loading-container,
.no-data-container {
  text-align: center;
  padding: 60px 20px;
}

.info-box {
  text-align: center;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.info-box.cortes {
  border-left-color: #ff6f00;
}

.info-box.cortes .info-value {
  color: #ff6f00;
}

.info-box.inicio {
  border-left-color: #4caf50;
}

.info-box.inicio .info-value-small {
  color: #4caf50;
}

.info-box.fim {
  border-left-color: #f44336;
}

.info-box.fim .info-value-small {
  color: #f44336;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1976d2;
}

.info-value-small {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1976d2;
}

.motorista-header {
  background-color: #f8f9fa;
  border-left: 4px solid #1976d2;
}

.motorista-nome {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  color: #1976d2;
}

.motorista-info {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: #555;
}

.tag-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e3f2fd;
  border: 1px solid #1976d2;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: monospace;
}

.bags-table :deep(.v-data-table__wrapper) {
  max-height: 400px;
  overflow-y: auto;
}

.bags-table :deep(th) {
  background-color: #37474f !important;
  color: white !important;
  font-weight: 600;
}

.bags-table :deep(td) {
  font-size: 0.9rem;
}

/* Estilo para os painéis de expansão */
:deep(.v-expansion-panel) {
  border: 1px solid #e0e0e0;
  border-radius: 8px !important;
  overflow: hidden;
}

:deep(.v-expansion-panel-title) {
  padding: 16px !important;
}

:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 !important;
}

/* Responsividade */
@media (max-width: 768px) {
  .motorista-nome {
    font-size: 1rem;
    margin-bottom: 8px;
  }

  .motorista-info {
    font-size: 0.85rem;
    margin-bottom: 4px;
  }

  .info-value {
    font-size: 1.5rem;
  }

  .info-value-small {
    font-size: 0.9rem;
  }
}
</style>
