<template>
  <BasePage>
    <v-container>
      <v-card>
        <v-card-title>
          <h1>Ordem de Serviço</h1>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start">
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="Ticket" 
                    variant="outlined"
                    v-model="ticket"
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
          <TableGuia
            :dados="dados"
            :headers="headers"
            :label-map-completo="labelMapCompleto"
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
import { ref, onMounted } from 'vue';
import BasePage from '@/components/BasePage.vue';
import TableGuia from './components/tableGuia.vue';
import { z1aJustif } from '../../stores/Consultas/getZ1AJustif';

const apiStore = z1aJustif();

const dados = ref([]);
const headers = ref([]);
const labelMapCompleto = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);

// Campos do filtro
const ticket = ref('');
const dataInicial = ref('');
const dataFinal = ref('');

// Função para gerar headers dinâmicos baseados no labelMap da API
const gerarHeaders = (dadosArray, labelMap = []) => {
  if (!dadosArray || dadosArray.length === 0) return [];
  
  console.log('gerarHeaders - dadosArray length:', dadosArray.length);
  console.log('gerarHeaders - labelMap:', labelMap);
  
  // Se tiver labelMap, usa ele para definir as colunas
  if (labelMap && Array.isArray(labelMap) && labelMap.length > 0) {
    console.log('Usando labelMap para gerar headers');
    const headersFromLabelMap = labelMap
      .filter(item => {
        console.log(`Campo ${item.key}: exibe = ${item.exibe}`);
        return item.exibe === 'S';
      })
      .map(item => ({
        title: item.label,
        key: item.key,
        align: 'start',
        sortable: true
      }));
    
    console.log('Headers gerados do labelMap:', headersFromLabelMap);
    return headersFromLabelMap;
  }
  
  console.log('Usando fallback para gerar headers');
  // Fallback: se não tiver labelMap, usa o método anterior
  const primeiroItem = dadosArray[0];
  return Object.keys(primeiroItem).map(key => ({
    title: formatarTituloColuna(key),
    key: key,
    align: 'start',
    sortable: true
  }));
};

// Função para filtrar e carregar dados da API
const onFilter = async () => {
  // Validação básica
  if (!ticket.value && !dataInicial.value && !dataFinal.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
    const params = {
      ticket: ticket.value || '',
      dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      usuario: localStorage.getItem('user')
    };

    console.log('Parâmetros enviados para a API:', params);

    const response = await apiStore.z1aJustif(params);
    console.log('Dados recebidos da API:', response);
    
    if (Array.isArray(response)) {
      dados.value = response;
      headers.value = gerarHeaders(response);
      labelMapCompleto.value = []; // Não tem labelMap neste caso
    } else if (response && Array.isArray(response.data)) {
      dados.value = response.data;
      headers.value = gerarHeaders(response.data, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
    } else if (response && Array.isArray(response.listTicket)) {
      // Trata o caso específico da API getZ1AJustif que retorna listTicket
      dados.value = response.listTicket;
      headers.value = gerarHeaders(response.listTicket, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
      console.log('LabelMap recebido:', response.labelMap);
      console.log('LabelMap completo armazenado:', labelMapCompleto.value);
      console.log('Headers gerados:', headers.value);
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