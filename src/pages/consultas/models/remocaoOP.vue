<template>
  <div class="template-container">
    <v-card-title class="text-h6 text-center bg-orange-lighten-1 text-white">
      Operação de remoção com OP
    </v-card-title>
    <v-card-text class="pa-4">
      <v-form>
        <!-- OP -->
        <div class="mb-3">
          <v-text-field
            v-model="remocao.op"
            label="OP"
            prepend-icon="mdi-file-document-outline"
            variant="outlined"
            density="compact"
            autocomplete="off"
          ></v-text-field>
        </div>

        <!-- Bloco Sugerido -->
        <div class="mb-3">
          <v-text-field
            v-model="remocao.blocoSugerido"
            label="Bloco Sugerido"
            prepend-icon="mdi-cube-outline"
            variant="outlined"
            density="compact"
            autocomplete="off"
          ></v-text-field>
        </div>

        <!-- Botão Buscar -->
        <div class="d-flex justify-center mb-4">
          <v-btn
            color="orange"
            variant="flat"
            prepend-icon="mdi-magnify"
            :loading="loadingBuscar"
            :disabled="!remocao.op || !remocao.blocoSugerido"
            @click="buscarDados"
          >
            Buscar
          </v-btn>
        </div>

        <!-- Tabela de resultado -->
        <div class="mb-4" v-if="dadosEmpenho.length > 0">
          <v-divider class="mb-3"></v-divider>
          <div class="table-scroll">
            <v-data-table
              :headers="headersEmpenho"
              :items="dadosEmpenho"
              density="compact"
              class="elevation-1 mb-3"
              hide-default-footer
              :items-per-page="-1"
            >
              <template v-slot:top>
                <v-toolbar flat density="compact">
                  <v-toolbar-title class="text-subtitle-2">
                    OP: {{ remocao.op }} - Bloco: {{ remocao.blocoSugerido }} | Sacas: {{ totalSacas.toFixed(2) }}
                  </v-toolbar-title>
                </v-toolbar>
              </template>
              <template v-slot:item.sacas="{ item }">
                {{ ((parseFloat(item.itOsPeso) || 0) / 59).toFixed(2) }}
              </template>
            </v-data-table>
          </div>
        </div>

        <!-- Empilhadeiras -->
        <v-select
          v-model="remocao.empilhadeira"
          label="Empilhadeiras"
          prepend-icon="mdi-forklift"
          :items="empilhadeiras"
          item-title="empidescr"
          item-value="empicod"
          variant="outlined"
          density="compact"
          class="mb-4"
          :loading="loadingEmpilhadeiras"
        ></v-select>
      </v-form>
      
      <!-- Botão de enviar -->
      <div class="d-flex justify-center">
        <v-btn 
          color="green" 
          variant="flat" 
          size="large"
          prepend-icon="mdi-send"
          @click="enviarOrdemRemocao"
        >
          Enviar Ordem de Remoção
        </v-btn>
      </div>
    </v-card-text>

    <!-- Dialog de resultado no centro da tela -->
    <v-dialog 
      v-model="mensagemResultado.mostrar" 
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon 
            :color="mensagemResultado.tipo === 'success' ? 'success' : 'error'" 
            class="me-2"
            size="large"
          >
            {{ mensagemResultado.tipo === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ mensagemResultado.titulo }}
        </v-card-title>
        
        <v-card-text class="py-4">
          <p class="text-body-1 mb-0">{{ mensagemResultado.texto }}</p>
        </v-card-text>
        
        <v-card-actions class="justify-end pa-4">
          <v-btn 
            :color="mensagemResultado.tipo === 'success' ? 'success' : 'error'"
            variant="flat"
            @click="mensagemResultado.mostrar = false"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { empilhadeira } from '../../../stores/Consultas/getEmpilhadeira';
import { WMSOS } from '../../../stores/Consultas/setWMSOS';
import { getEmpenhoProd } from '../../../stores/Consultas/getEmpenhoProd';

// Props
const props = defineProps({
  empilhadeiras: {
    type: Array,
    default: () => []
  },
  loadingEmpilhadeiras: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['ordem-enviada']);

// Stores
const empilhadeiraStore = empilhadeira();
const WMSOSStore = WMSOS();
const getEmpenhoProdStore = getEmpenhoProd();

// Estados do formulário
const remocao = ref({
  op: '',
  blocoSugerido: '',
  empilhadeira: null
});

// Estados de loading
const loadingEmpilhadeiras = ref(false);
const loadingBuscar = ref(false);

// Dados buscados
const dadosEmpenho = ref([]);

// Total de sacas
const totalSacas = computed(() =>
  dadosEmpenho.value.reduce((acc, item) => acc + ((parseFloat(item.itOsPeso) || 0) / 59), 0)
);

// Estado para mensagem de resultado
const mensagemResultado = ref({
  mostrar: false,
  tipo: 'success',
  titulo: '',
  texto: ''
});

// Dados
const empilhadeiras = ref([]);

const headersEmpenho = ref([
  { title: 'Item', key: 'itOSItem', sortable: false },
  { title: 'Lote', key: 'lote', sortable: false },
  { title: 'Sacas', key: 'sacas', sortable: false }
]);

// Buscar dados da API
const buscarDados = async () => {
  dadosEmpenho.value = [];
  loadingBuscar.value = true;
  try {
    getEmpenhoProdStore.$reset();
    const resposta = await getEmpenhoProdStore.getEmpenhoProd({
      op: remocao.value.op,
      sugerido: remocao.value.blocoSugerido
    });
    dadosEmpenho.value = Array.isArray(resposta?.retorno) ? resposta.retorno : [];
    if (dadosEmpenho.value.length === 0) {
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'error',
        titulo: 'OP não encontrada!',
        texto: `Não foram encontrados dados para a OP: ${remocao.value.op}`
      };
    }
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    dadosEmpenho.value = [];
  } finally {
    loadingBuscar.value = false;
  }
};

// Função para enviar ordem de remoção
const enviarOrdemRemocao = async () => {
  if (!remocao.value.op || !remocao.value.blocoSugerido || !remocao.value.empilhadeira) {
    console.warn('Todos os campos são obrigatórios');
    mensagemResultado.value = {
      mostrar: true,
      tipo: 'error',
      titulo: 'Campos Obrigatórios!',
      texto: 'Por favor, preencha todos os campos: OP, Bloco Sugerido e Empilhadeira.'
    };
    return;
  }
  
  try {
    const dadosOE = dadosEmpenho.value;
    
    if (!dadosOE || dadosOE.length === 0) {
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'error',
        titulo: 'OP não encontrada!',
        texto: `Nenhum dado carregado. Clique em Buscar primeiro.`
      };
      return;
    }
    
    const primeiroItem = dadosOE[0];
    
    // Obtém a data e hora atuais
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    
    const dataAtual = `${ano}${mes}${dia}`;
    const horaAtual = `${horas}:${minutos}`;
    
    const payload = {
      wms_os: {
        OSID: "",
        MotCod: "", 
        OSOpTck: remocao.value.op,
        OSPrioridade: primeiroItem.osprioridade || "0",
        OSBlocoSuger: remocao.value.blocoSugerido ,
        OSData: dataAtual, 
        OSHora: horaAtual,
        OSStatus: "AT"
      },
      wms_itemos: dadosOE.map(item => ({
        OSID: "",
        ItOSItem: item.itOSItem || "",
        OpTck: remocao.value.op,
        EmpiCod: remocao.value.empilhadeira,
        MotCod: item.motCod || "",
        ItOSData: dataAtual,
        ItOSHora: horaAtual || "", 
        ItOsTagBag: item.itOsTagBag || "",
        ItOsOrigem: item.itOsOrigem || "",
        ItOsTagOrigem: item.itOsTagOrigem || "",
        ItOsDestino: remocao.value.blocoSugerido || item.itOsDestino,
        ItOsTagDestino: item.itOsTagDestino || "",
        ItOSStatus: "AB",
        Lote: item.lote || item.itOSLote || "",
        ItOsPeso: item.itOsPeso,
        ItOsObs: item.itOsObs || ""
      }))
    };
    
    const response = await WMSOSStore.WMSOS(payload);
    
    if (response && response.code === 600) {
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'success',
        titulo: 'Sucesso!',
        texto: `${response.message} - Código: ${response.code}. Ordem: ${response.data}. Total de itens: ${payload.wms_itemos.length}`
      };
      
      dadosEmpenho.value = [];
      remocao.value = {
        op: '',
        blocoSugerido: '',
        empilhadeira: null
      };
    } else {
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'error',
        titulo: 'Erro!',
        texto: `${response?.message || 'Erro desconhecido'} - Código: ${response?.code || 'N/A'}`
      };
    }
    
    emit('ordem-enviada', { tipo: 'operacao', response, payload });
    
  } catch (error) {
    console.error('Erro ao enviar operação: ', error);
    
    mensagemResultado.value = {
      mostrar: true,
      tipo: 'error',
      titulo: 'Erro de Comunicação!',
      texto: error.message || 'Não foi possível enviar a operação. Tente novamente.'
    };
    
    emit('ordem-enviada', { tipo: 'operacao', error });
  }
};

const carregarEmpilhadeiras = async () => {
  loadingEmpilhadeiras.value = true;
  try {
    const dados = await empilhadeiraStore.empilhadeira();
    empilhadeiras.value = Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error('Erro ao carregar empilhadeiras:', error);
    empilhadeiras.value = [];
  } finally {
    loadingEmpilhadeiras.value = false;
  }
};
onMounted(() => {
  carregarEmpilhadeiras();
});
</script>

<style scoped>
.template-container {
  min-height: 400px;
}

.v-card-title {
  border-radius: 4px 4px 0 0;
}

.v-btn {
  font-weight: 500;
}

/* Estilo para as tabelas com scroll */
.table-scroll {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>

