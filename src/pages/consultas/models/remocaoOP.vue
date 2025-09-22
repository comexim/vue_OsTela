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
          ></v-text-field>
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
import { ref, watch, onMounted } from 'vue';
import { listaEndereco } from '../../../stores/Consultas/getListaEndereco';
import { empilhadeira } from '../../../stores/Consultas/getEmpilhadeira';
import { ordemRemocao } from '../../../stores/Consultas/postOrdemRemocao';
import { listaBag } from '../../../stores/Consultas/getListaBag';

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
const listaEnderecoStore = listaEndereco();
const empilhadeiraStore = empilhadeira();
const ordemRemocaoStore = ordemRemocao();
const listaBagStore = listaBag();

// Estados do formulário
const remocao = ref({
  op: '',
  blocoSugerido: '',
  empilhadeira: null
});

// Estados de loading
const loadingEmpilhadeiras = ref(false);

// Estado para mensagem de resultado
const mensagemResultado = ref({
  mostrar: false,
  tipo: 'success',
  titulo: '',
  texto: ''
});

// Dados
const empilhadeiras = ref([]);

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
  
  const payload = {
    op: remocao.value.op,
    blocoSugerido: remocao.value.blocoSugerido,
    empicod: remocao.value.empilhadeira
  };
  
  try {
    console.log("payload da operação: ", payload);
    const response = await ordemRemocaoStore.ordemRemocao(payload);
    console.log('Resposta da API: ', response);
    
    // Verifica se a resposta foi bem-sucedida
    if (response && response.code === 600) {
      // Exibe mensagem de sucesso
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'success',
        titulo: 'Sucesso!',
        texto: `${response.message} - Código: ${response.code}. Ordem: ${response.data}`
      };
      
      // Limpa o formulário após sucesso
      remocao.value = {
        op: '',
        blocoSugerido: '',
        empilhadeira: null
      };
    } else {
      // Exibe mensagem de erro se o código não for 600
      mensagemResultado.value = {
        mostrar: true,
        tipo: 'error',
        titulo: 'Erro!',
        texto: `${response?.message || 'Erro desconhecido'} - Código: ${response?.code || 'N/A'}`
      };
    }
    
    // Emite evento para o componente pai
    emit('ordem-enviada', { tipo: 'operacao', response, payload });
    
  } catch (error) {
    console.error('Erro ao enviar operação: ', error);
    
    // Exibe mensagem de erro
    mensagemResultado.value = {
      mostrar: true,
      tipo: 'error',
      titulo: 'Erro de Comunicação!',
      texto: 'Não foi possível enviar a operação. Tente novamente.'
    };
    
    emit('ordem-enviada', { tipo: 'operacao', error, payload });
  }
};

// Função para carregar empilhadeiras
const carregarEmpilhadeiras = async () => {
  loadingEmpilhadeiras.value = true;
  try {
    const dados = await empilhadeiraStore.empilhadeira();
    empilhadeiras.value = Array.isArray(dados) ? dados : [];
    console.log('Empilhadeiras carregadas:', empilhadeiras.value);
  } catch (error) {
    console.error('Erro ao carregar empilhadeiras:', error);
    empilhadeiras.value = [];
  } finally {
    loadingEmpilhadeiras.value = false;
  }
};

// Lifecycle hooks
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
