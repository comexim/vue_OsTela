<template>
  <v-container fluid class="dashboard-container">
    <modalPositions 
      v-model="modalOpen" 
      :initialTab="selectedTab"
      :enderColors="enderColors"
      :bagEnder="bagEnder"
    />
    
    <modalBags 
      v-model="modalBagsOpen" 
      :initialTab="selectedBagTab"
      :bagData="bagData"
    />
    
    <modalBagPeso 
      v-model="modalBagPesoOpen" 
      :bagsPeso="bagsPeso"
    />
    
    <modalProtheusXWMS 
      v-model="modalProtheusXWMSOpen" 
      :dadosProtheusWMS="dadosProtheusWMS"
    />
    
    <v-card class="dashboard-card elevation-4">
      <v-card-title class="text-center bg-primary">
        <h2 class="dashboard-title">Censo do Armazém</h2>
      </v-card-title>
      
      <v-card-text class="pa-3">
        <v-row class="stats-row">
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="blue-grey-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Endereços</div>
                <div class="stat-value">{{ formatNumber(censo.enderecos) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="green-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Livres</div>
                <div class="stat-value">{{ formatNumber(censo.livres) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="teal-lighten-5"
              @click="openModal('4pos')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">4 Posições</div>
                <div class="stat-value">{{ formatNumber(censo.quatroPosicoes) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="cyan-lighten-5"
              @click="openModal('3pos')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">3 Posições</div>
                <div class="stat-value">{{ formatNumber(censo.tresPosicoes) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="light-blue-lighten-5"
              @click="openModal('2pos')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">2 Posições</div>
                <div class="stat-value">{{ formatNumber(censo.duasPosicoes) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="indigo-lighten-5"
              @click="openModal('1pos')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">1 Posição</div>
                <div class="stat-value">{{ formatNumber(censo.umaPosicao) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="orange-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Ocupados</div>
                <div class="stat-value">{{ formatNumber(censo.ocupados) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="amber-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Empenhados</div>
                <div class="stat-value">{{ formatNumber(censo.empenhados) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="red-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Bloqueados</div>
                <div class="stat-value">{{ formatNumber(censo.bloqueados) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="dashboard-card elevation-4" style="margin-top: 20px;">
      <v-card-title class="text-center bg-secondary">
        <h2 class="dashboard-title">Bags</h2>
      </v-card-title>
      
      <v-card-text class="pa-3">
        <v-row class="stats-row">
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="blue-grey-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Bags</div>
                <div class="stat-value">{{ formatNumber(bags.total) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="green-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Livres</div>
                <div class="stat-value">{{ formatNumber(bags.livres) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card class="stat-card elevation-2" color="teal-lighten-5">
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Depositados</div>
                <div class="stat-value">{{ formatNumber(bags.depositados) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="cyan-lighten-5"
              @click="openModalBags('embegadora')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Na Embegadora</div>
                <div class="stat-value">{{ formatNumber(bags.naEmbegadora) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="light-blue-lighten-5"
              @click="openModalBags('transito')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Em Trânsito</div>
                <div class="stat-value">{{ formatNumber(bags.emTransito) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="indigo-lighten-5"
              @click="openModalBags('corte')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Para Corte</div>
                <div class="stat-value">{{ formatNumber(bags.paraCorte) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="orange-lighten-5"
              @click="openModal('invalidas')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Posição Inválida</div>
                <div class="stat-value">{{ formatNumber(bags.posicaoInvalida) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="amber-lighten-5"
              @click="openModalBags('vazios')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Depositados Vazios</div>
                <div class="stat-value">{{ formatNumber(bags.depositadosVazios) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="auto">
            <v-card 
              class="stat-card elevation-2 cursor-pointer" 
              color="red-lighten-5"
              @click="openModalBags('duplicidade')"
            >
              <v-card-text class="text-center pa-2">
                <div class="stat-label">Em Duplicidade</div>
                <div class="stat-value">{{ formatNumber(bags.emDuplicidade) }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row style="margin-top: 20px;">
      <v-col cols="auto">
        <v-card class="dashboard-card-small elevation-4" style="max-width: 300px;">
          <v-card-text class="pa-3">
            <v-row>
              <v-col cols="12">
                <v-card 
                  class="stat-card elevation-2 cursor-pointer" 
                  color="deep-orange-lighten-4"
                  @click="openModalBagPeso"
                >
                  <v-card-text class="text-center pa-2">
                    <div class="stat-label">Bags < 800kg</div>
                    <div class="stat-value">{{ formatNumber(bagsPeso.length) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="auto">
        <v-card class="dashboard-card-small elevation-4" style="max-width: 300px;">
          <v-card-text class="pa-3">
            <v-row>
              <v-col cols="12">
                <v-card 
                  class="stat-card elevation-2 cursor-pointer" 
                  color="blue-lighten-4"
                  @click="openModalProtheusXWMS"
                >
                  <v-card-text class="text-center pa-2">
                    <div class="stat-label">Protheus X WMS</div>
                    <div class="stat-value">{{ formatNumber(dadosProtheusWMS.length) }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { enderColor } from '../../stores/Consultas/getEnderColor';
import { getBagPos } from '../../stores/Consultas/getBagPos';
import { getBagEnder } from '../../stores/Consultas/getBagEnder';
import { getProdProtheusXWMS } from '../../stores/Consultas/getProdProtheusXWMS';
import modalPositions from './DashboardComponents/modalPositions.vue';
import modalBags from './DashboardComponents/modalBags.vue';
import modalBagPeso from './DashboardComponents/modalBagPeso.vue';
import modalProtheusXWMS from './DashboardComponents/modalProtheusXWMS.vue';

const enderColorStore = enderColor();
const enderColors = ref([]);
const bagPosStore = getBagPos();
const bagEnder = ref([]);
const bagEnderStore = getBagEnder();
const bagsPeso = ref([]);
const protheusWMSStore = getProdProtheusXWMS();
const dadosProtheusWMS = ref([]);
let updateInterval = null;

const modalOpen = ref(false);
const selectedTab = ref('4pos');

const modalBagsOpen = ref(false);
const selectedBagTab = ref('transito');
const bagData = ref({
  Transito: [],
  Embarcadas: [],
  Cortes: [],
  Vazios: [],
  Duplicados: []
});

const modalBagPesoOpen = ref(false);

const modalProtheusXWMSOpen = ref(false);

const openModal = (tab) => {
  selectedTab.value = tab;
  modalOpen.value = true;
};

const openModalBags = (tab) => {
  selectedBagTab.value = tab;
  modalBagsOpen.value = true;
};

const openModalBagPeso = () => {
  modalBagPesoOpen.value = true;
};

const openModalProtheusXWMS = () => {
  modalProtheusXWMSOpen.value = true;
};

async function loadEnderColor() {
  try {
    const response = await enderColorStore.enderColor();
    enderColors.value = response.map(item => ({
      code: item.enderCod,
      status: item.enderStatus,
      sacas: parseInt(item.enderSacas) || 0
    }));
  } catch (error) {
    console.error('Erro ao carregar dados do armazém:', error);
  }
}

async function loadBagEnder() {
  try {
    const response = await bagEnderStore.getBagEnder();
    
    if (response && response.bags && Array.isArray(response.bags)) {
      bagsPeso.value = response.bags;
    }
  } catch (error) {
    console.error('Erro ao carregar dados de bags com peso:', error);
  }
}

async function loadProtheusXWMS() {
  try {
    const response = await protheusWMSStore.getProdProtheusXWMS();
    
    if (Array.isArray(response) && response.length > 0) {
      dadosProtheusWMS.value = response;
    } else {
      dadosProtheusWMS.value = [];
    }
  } catch (error) {
    console.error('Erro ao carregar dados Protheus X WMS:', error);
    dadosProtheusWMS.value = [];
  }
}

async function loadBagPos() {
  try {
    const response = await bagPosStore.getBagPos();
    console.log('Response completa da API:', response);
    
    if (response) {
      bags.value = {
        total: (response.LIVRES || 0) + (response.DEPOSITADAS || 0) + (response.EMBEGADAS || 0) + (response.TRANSITO || 0),
        livres: response.LIVRES || 0,
        depositados: response.DEPOSITADAS || 0,
        naEmbegadora: response.EMBEGADAS || 0,
        emTransito: response.TRANSITO || 0,
        paraCorte: 0,
        posicaoInvalida: 0,
        depositadosVazios: response.ZERADOS || 0,
        emDuplicidade: 0
      };
      
      // Extrai dados de endereços e bags
      if (response.Enderecos && Array.isArray(response.Enderecos)) {
        console.log('Endereços encontrados:', response.Enderecos.length);
        bagEnder.value = response.Enderecos;
      }
      
      // Extrai dados para modalBags
      bagData.value = {
        Transito: response.Transito || [],
        Embarcadas: response.Embarcadas || [],
        Cortes: response.Cortes || [],
        Vazios: response.Vazios || [],
        Duplicados: response.Duplicados || []
      };
    }
  } catch (error) {
    console.error('Erro ao carregar dados de bags:', error);
  }
}

// Função para formatar números com separador de milhares
const formatNumber = (value) => {
  if (value == null) return '0';
  return value.toLocaleString('pt-BR');
};

// Total de endereços
const totalEnderecos = computed(() => {
  return enderColors.value.filter(item => 
    !["B","D","L","M"].includes(item.code.charAt(0))
  ).length;
});

// Endereços livres
const countLivres = computed(() => {
  return enderColors.value.filter(item =>
    item.status === "LV" && !["B","D","L","M"].includes(item.code.charAt(0))
  ).length;
});

// Função auxiliar para extrair o prefixo do endereço (remove a última letra)
const getEnderecoPrefixo = (enderCod) => {
  if (!enderCod || enderCod.length < 2) return enderCod;
  return enderCod.slice(0, -1); // Remove a última letra (A, B, C, D)
};

// Agrupa apenas endereços LIVRES por prefixo e conta quantas posições cada grupo tem
const enderecosAgrupadosLivres = computed(() => {
  const grupos = {};
  
  // Filtra apenas endereços LIVRES e que não começam com B, D, L, M
  enderColors.value
    .filter(item => item.status === "LV" && !["B","D","L","M"].includes(item.code.charAt(0)))
    .forEach(item => {
      const prefixo = getEnderecoPrefixo(item.code);
      if (!grupos[prefixo]) {
        grupos[prefixo] = new Set();
      }
      // Adiciona a última letra (A, B, C, D) ao set
      const ultimaLetra = item.code.charAt(item.code.length - 1);
      grupos[prefixo].add(ultimaLetra);
    });
  
  return grupos;
});

// Endereços com 4 posições - grupos que contêm a letra A
const count4Posicoes = computed(() => {
  let count = 0;
  Object.values(enderecosAgrupadosLivres.value).forEach(letras => {
    if (letras.has('A')) {
      count++; // Conta 1 grupo
    }
  });
  return count;
});

// Endereços com 3 posições - grupos que contêm a letra B
const count3Posicoes = computed(() => {
  let count = 0;
  Object.values(enderecosAgrupadosLivres.value).forEach(letras => {
    if (letras.has('B')) {
      count++; // Conta 1 grupo
    }
  });
  return count;
});

// Endereços com 2 posições - grupos que contêm a letra C
const count2Posicoes = computed(() => {
  let count = 0;
  Object.values(enderecosAgrupadosLivres.value).forEach(letras => {
    if (letras.has('C')) {
      count++; // Conta 1 grupo
    }
  });
  return count;
});

// Endereços com 1 posição - grupos que contêm a letra D
const count1Posicao = computed(() => {
  let count = 0;
  Object.values(enderecosAgrupadosLivres.value).forEach(letras => {
    if (letras.has('D')) {
      count++; // Conta 1 grupo
    }
  });
  return count;
});

// Endereços ocupados
const countOcupados = computed(() => {
  return enderColors.value.filter(item => item.status === "OC").length;
});

// Endereços empenhados
const countEmpenhados = computed(() => {
  return enderColors.value.filter(item => item.status === "EM").length;
});

// Endereços bloqueados
const countBloqueados = computed(() => {
  return enderColors.value.filter(item => item.status === "BQ").length;
});

const censo = computed(() => ({
  enderecos: totalEnderecos.value,
  livres: countLivres.value,
  quatroPosicoes: count4Posicoes.value,
  tresPosicoes: count3Posicoes.value,
  duasPosicoes: count2Posicoes.value,
  umaPosicao: count1Posicao.value,
  ocupados: countOcupados.value,
  empenhados: countEmpenhados.value,
  bloqueados: countBloqueados.value
}));

// Dados de Bags (será preenchido pela API)
const bags = ref({
  total: 0,
  livres: 0,
  depositados: 0,
  naEmbegadora: 0,
  emTransito: 0,
  paraCorte: 0,
  posicaoInvalida: 0,
  depositadosVazios: 0,
  emDuplicidade: 0
});

onMounted(() => {
  loadEnderColor();
  loadBagPos();
  loadBagEnder();
  loadProtheusXWMS();
  
  // Atualiza os dados a cada 30 segundos
  updateInterval = setInterval(() => {
    loadEnderColor();
    loadBagPos();
    loadBagEnder();
    loadProtheusXWMS();
  }, 30000);
});

onUnmounted(() => {
  // Limpa o intervalo quando o componente for desmontado
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  padding: 10px;
  overflow-y: auto;
}

.dashboard-card {
  width: 100%;
  max-width: 1600px;
  border-radius: 12px;
}

.dashboard-card-small {
  border-radius: 12px;
}

.dashboard-title {
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  padding: 10px;
}

.stats-row {
  gap: 10px;
}

.stat-card {
  min-width: 122px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cursor-pointer {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #616161;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2e7d32;
  line-height: 1;
}

.bg-primary {
  background: linear-gradient(135deg, #2e7d32 0%, #388e3c 100%);
}

.bg-secondary {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
}
</style>