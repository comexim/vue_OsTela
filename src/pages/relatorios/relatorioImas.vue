<template>
  <BasePage>
    <v-container>
      <v-card>
        <v-card-title>
          <h1>Relatório Imãs</h1>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start">
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="Lote Inicial" 
                    variant="outlined"
                    v-model="loteInicial"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="Data Inicial" 
                    variant="outlined" 
                    v-model="dataInicial"
                    type="date"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="Data Final" 
                    variant="outlined" 
                    v-model="dataFinal"
                    type="date"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row class="justify-center mt-2">
                <v-btn 
                  variant="tonal" 
                  color="blue-accent-4" 
                  prepend-icon="mdi-magnify" 
                  @click="onFilter"
                  :loading="loading"
                >
                  Filtrar
                </v-btn>
              </v-row>
            </v-form>
          </div>

          <!-- Componente da Tabela -->
          <ImasTable
            :dados="dados"
            :headers="headers"
            :loading="loading"
            :mostrar-tabela="mostrarTabela"
            v-model:busca="busca"
            @atualizar="onFilter"
          />
        </v-card-text>
      </v-card>
    </v-container>
  </BasePage>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import BasePage from '@/components/BasePage.vue';
import ImasTable from './components/imasTable.vue';
import { getapimas } from '../../stores/Consultas/getApImas';

const apiStore = getapimas();

const dados = ref([]);
const headers = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);

// Campos do filtro
const loteInicial = ref('');
const dataInicial = ref('');
const dataFinal = ref('');

// Função para gerar headers dinâmicos baseados nos dados da API
const gerarHeaders = (dadosArray) => {
  if (!dadosArray || dadosArray.length === 0) return [];
  
  const primeiroItem = dadosArray[0];
  return Object.keys(primeiroItem).map(key => ({
    title: formatarTituloColuna(key),
    key: key,
    align: 'start',
    sortable: true
  }));
};

// Função para formatar o título das colunas
const formatarTituloColuna = (key) => {
  // Remove prefixos comuns e converte para formato legível
  const semPrefixo = key.replace(/^ap/, '');
  
  // Mapeia alguns campos conhecidos
  const mapeamento = {
    'Lote': 'Lote',
    'Equipto': 'Equipamento',
    'Quant': 'Quantidade',
    'Obs': 'Observação',
    'Data': 'Data',
    'Hora': 'Hora'
  };
  
  return mapeamento[semPrefixo] || semPrefixo || key;
};


// Função para filtrar e carregar dados da API
const onFilter = async () => {
  // Validação básica
  if (!loteInicial.value && !dataInicial.value && !dataFinal.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
    const params = {
      loteIni: loteInicial.value || '',
      loteFim: loteInicial.value || '',
      dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '' // Converte YYYY-MM-DD para YYYYMMDD
    };

    console.log('Parâmetros enviados para a API:', params);

    const response = await apiStore.getapimas(params);
    console.log('Dados recebidos da API:', response);
    
    if (Array.isArray(response)) {
      dados.value = response;
      headers.value = gerarHeaders(response);
    } else if (response && Array.isArray(response.data)) {
      dados.value = response.data;
      headers.value = gerarHeaders(response.data);
    } else {
      console.warn('Formato de dados inesperado:', response);
      dados.value = [];
      headers.value = [];
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

// Função para carregar dados da API (mantida para compatibilidade)
const carregarDados = async () => {
  // Chama a função de filtro se já tiver dados de filtro
  if (mostrarTabela.value) {
    await onFilter();
  }
};

onMounted(() => {
  // Remove o carregamento automático - agora só carrega quando filtrar
  console.log('Página carregada. Use os filtros para buscar dados.');
});
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
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