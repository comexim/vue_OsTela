<template>
  <v-container class="container">
    <v-card>
      <v-card-title>
        <h1>Saldo Silo WMS x SUP</h1>
      </v-card-title>
      
      <v-card-text>
        <!-- Botão de Carregar/Atualizar -->
        <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
          <v-row class="justify-center">
            <v-btn 
              variant="tonal" 
              :color="mostrarTabela ? 'success' : 'blue-accent-4'"
              :prepend-icon="mostrarTabela ? 'mdi-refresh' : 'mdi-database-search'"
              @click="carregarDados"
              :loading="loading"
              size="large"
            >
              {{ mostrarTabela ? 'Atualizar Dados' : 'Carregar Dados' }}
            </v-btn>
          </v-row>
        </div>

        <!-- Componente da Tabela -->
        <SaldoSiloTable
          :dados="dados"
          :headers="headers"
          :loading="loading"
          :mostrar-tabela="mostrarTabela"
          v-model:busca="busca"
          @atualizar="carregarDados"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import SaldoSiloTable from './components/saldoSiloTable.vue';
import { getSiloWMSSUP } from '../../stores/Consultas/getSiloWMSSUP';

const apiStore = getSiloWMSSUP();

const dados = ref([]);
const headers = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);

// Função para gerar headers dinâmicos baseados nos dados da API
const gerarHeaders = (dadosArray) => {
  if (!dadosArray || dadosArray.length === 0) return [];
  
  const primeiroItem = dadosArray[0];
  const keys = Object.keys(primeiroItem);
  const headersGerados = [];
  
  keys.forEach(key => {
    headersGerados.push({
      title: formatarTituloColuna(key),
      key: key,
      align: 'start',
      sortable: true
    });
  });
  
  return headersGerados;
};

// Função para formatar o título das colunas
const formatarTituloColuna = (key) => {
  // Mapeia os campos da API
  const mapeamento = {
    'codigo': 'Silo',
    'capacidade': 'Capacidade',
    'saldowms': 'Saldo WMS',
    'wmssacas': 'WMS Sacas',
    'saldosup': 'Saldo SUP',
    'supsacas': 'SUP Sacas',
    'difer': 'Diferença',
    'lote': 'Lote'
  };
  
  return mapeamento[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

// Função para carregar dados da API
const carregarDados = async () => {
  loading.value = true;
  try {
    console.log('Carregando dados da API getSiloWMSSUP...');
    
    const response = await apiStore.getSiloWMSSUP();
    console.log('Dados recebidos da API:', response);
    
    let dadosRecebidos = [];
    if (Array.isArray(response)) {
      dadosRecebidos = response;
    } else if (response && Array.isArray(response.data)) {
      dadosRecebidos = response.data;
    } else {
      console.warn('Formato de dados inesperado:', response);
      dados.value = [];
      headers.value = [];
      loading.value = false;
      return;
    }
    
    // Dados já vêm completos da API, apenas atribui
    dados.value = dadosRecebidos;
    
    headers.value = gerarHeaders(dadosRecebidos);
    mostrarTabela.value = true;
    
    if (dados.value.length === 0) {
      alert('Nenhum dado encontrado');
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    dados.value = [];
    headers.value = [];
    alert('Erro ao carregar dados. Verifique o console para mais detalhes.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
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
</style>
