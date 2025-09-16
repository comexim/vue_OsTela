<template>
  <BasePage>
    <v-container>
      <v-card>
        <v-card-title>
          <h1>Produção e parada de maquinários</h1>
        </v-card-title>
        
        <v-card-text>
          <!-- Seção de Filtros -->
          <div class="w-100 pa-4 border rounded-xl elevation-2 mb-4">
            <div class="text-h6 text-left mb-3">Filtros</div>
            <v-form @submit.prevent="onFilter">
              <v-row align="start" justify="start">
                <v-col cols="12" md="4">
                  <v-text-field 
                    label="OP" 
                    variant="outlined"
                    v-model="op"
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
                <v-col cols="12" md="4">
                  <v-select
                    label="Maquinário"
                    variant="outlined"
                    v-model="selectedMaquinario"
                    :items="maquinarios"
                    item-title="nome"
                    item-value="id"
                    density="compact"
                  ></v-select>
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
          <TableProdPar
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
import TableProdPar from './components/tableProdPar.vue'
import { prodPar } from '../../stores/Consultas/getProdPar';
import { maquinario } from '../../stores/Consultas/getMaquinario';

const prodParStore = prodPar();
const maquinarioStore = maquinario();

const dados = ref([]);
const headers = ref([]);
const labelMapCompleto = ref([]);
const loading = ref(false);
const busca = ref('');
const mostrarTabela = ref(false);
const maquinarios = ref([]);


// Campos do filtro
const op = ref('');
const selectedMaquinario = ref('');
const dataInicial = ref('');
const dataFinal = ref('');

// Função para carregar maquinários
const carregarMaquinarios = async () => {
  try {
    const response = await maquinarioStore.maquinario();
    if (Array.isArray(response)) {
      maquinarios.value = response.map((nome, index) => {
        return {
          nome: nome.trim(), // Remove espaços desnecessários
          id: String(index + 1).padStart(3, '0') // Adiciona IDs sequenciais formatados como 001, 002, etc.
        };
      });
    }
  } catch (error) {
    console.error('Erro ao carregar maquinários:', error);
  }
};

// Função para formatar títulos das colunas
const formatarTituloColuna = (key) => {
  const mapeamento = {
    'parID': 'ID Parada',
    'maqCod': 'Código Máquina',
    'parDataIni': 'Data Início',
    'parHoraIni': 'Hora Início',
    'parDataFim': 'Data Fim',
    'parHoraFim': 'Hora Fim',
    'parTipo': 'Tipo Parada',
    'parOP': 'OP',
    'userCod': 'Usuário',
    'parMotivo': 'Motivo',
    'parQtdVez': 'Quantidade',
    'parPeneira': 'Peneira'
  };
  
  return mapeamento[key] || key;
};

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
  if (!op.value && !dataInicial.value && !dataFinal.value && !selectedMaquinario.value) {
    alert('Preencha pelo menos um campo do filtro');
    return;
  }

  loading.value = true;
  try {
    // Prepara os parâmetros para a API
    const params = {
      op: op.value || '',
      dataIni: dataInicial.value ? dataInicial.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      dataFim: dataFinal.value ? dataFinal.value.replace(/-/g, '') : '', // Converte YYYY-MM-DD para YYYYMMDD
      maqCod: selectedMaquinario.value || '',
      usuario: localStorage.getItem('user')
    };

    console.log('Parâmetros enviados para a API:', params);

    const response = await prodParStore.prodPar(params);
    console.log('Dados recebidos da API:', response);
    
    if (Array.isArray(response)) {
      dados.value = response;
      headers.value = gerarHeaders(response);
      labelMapCompleto.value = []; 
    } else if (response && Array.isArray(response.listaMov)) {
      // Trata o caso específico da API prodPar que retorna listaMov
      dados.value = response.listaMov;
      headers.value = gerarHeaders(response.listaMov, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
      console.log('LabelMap recebido:', response.labelMap);
      console.log('LabelMap completo armazenado:', labelMapCompleto.value);
      console.log('Headers gerados:', headers.value);
    } else if (response && Array.isArray(response.data)) {
      dados.value = response.data;
      headers.value = gerarHeaders(response.data, response.labelMap);
      labelMapCompleto.value = response.labelMap || []; // Armazena labelMap completo
    } else if (response && Array.isArray(response.listaMov)) {
      dados.value = response.listaMov;
      headers.value = gerarHeaders(response.listaMov, response.labelMap);
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

onMounted(() => {
  carregarMaquinarios();
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