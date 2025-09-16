<template>
  <BasePage>
    <v-container class="centralizado">
      <v-card class="formulario-card">
        <v-card-title>
          <h1>Apontamento Imãs</h1>
        </v-card-title>
        
        <v-card-text class="pa-3">
          <v-col cols="12" class="py-1">
            <v-select
              v-model="equipamento"
              :items="equipamentos"
              label="Equipamento"
              item-title="cadAuxDescr"
              item-value="cadAuxCod"
              outlined
              dense
              class="campo-destaque"
            ></v-select>
          </v-col>

          <v-col cols="12" class="py-1">
            <v-text-field
              v-model="lote"
              label="Lote"
              outlined
              dense
              class="campo-destaque"
            ></v-text-field>
          </v-col>

          <v-col cols="12" class="py-1">
            <v-text-field
              v-model="quantidade"
              label="Quantidade"
              type="number"
              outlined
              dense
              class="campo-destaque"
            ></v-text-field>
          </v-col>

          <v-col cols="12" class="py-1">
            <v-text-field
              v-model="observacao"
              label="Observação"
              outlined
              dense
              class="campo-destaque"
            ></v-text-field>
          </v-col>

          <v-row class="ma-0">
            <v-col cols="6" class="py-1">
              <v-text-field
                v-model="data"
                label="Data"
                readonly
                outlined
                dense
                class="campo-destaque"
              ></v-text-field>
            </v-col>

            <v-col cols="6" class="py-1">
              <v-text-field
                v-model="hora"
                label="Hora"
                readonly
                outlined
                dense
                class="campo-destaque"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row class="ma-0">
            <v-col cols="12" class="text-center py-2">
              <v-btn color="blue" class="white--text" @click="salvar">Salvar</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </BasePage>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import BasePage from '@/components/BasePage.vue';
import { cadAux } from '../../stores/Movimentos/getCadAux';
import { apImas } from '../../stores/Consultas/postApImas';

const equipamentoStore = cadAux();
const apImasStore = apImas();

const equipamento = ref('');
const equipamentos = ref([]);
const lote = ref('');
const quantidade = ref(null);
const observacao = ref('');
const data = ref('');
const hora = ref('');

const updateDateTime = () => {
  const now = new Date();
  data.value = now.toLocaleDateString('pt-BR');
  hora.value = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const carregarEquipametos = async() => {
    try {
        const tipo = 'APT';
        const dados = await equipamentoStore.cadAux(tipo);
        equipamentos.value = Array.isArray(dados) ? dados: [];
    } catch (error) {
        console.error('Erro ao carregar equipamentos: ', error);
        equipamentos.value = [];
    }
}

const salvar = async () => {
  try {
    const payload = {
      apLote: lote.value,
      apEquipto: equipamento.value,
      apQuant: Number(quantidade.value),
      apObs: observacao.value,
      apData: data.value.split('/').reverse().join(''),
      apHora: hora.value,
    };

    console.log('Enviando dados para a API:', payload);

    const response = await apImasStore.apImas(payload);
    console.log('Resposta da API:', response);

    if (response.success) {
      alert('Dados enviados com sucesso!');

      // Limpa os campos do formulário
      equipamento.value = '';
      lote.value = '';
      quantidade.value = null;
      observacao.value = '';
    } else {
      alert(`Erro ao enviar dados: ${response.message}`);
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
    alert('Ocorreu um erro inesperado. Verifique o console para mais detalhes.');
  }
};

onMounted(() => {
  updateDateTime();
  setInterval(() => {
    updateDateTime();
  }, 60000); // Atualiza a cada 1 minuto
  carregarEquipametos();
});
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.centralizado {
  max-width: 500px;
  margin: 0 auto;
  padding: 10px;
}

.formulario-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid #e0e0e0;
  padding: 8px;
}

.campo-destaque {
  background-color: #ffffff;
  border-radius: 8px;
  margin-bottom: 4px;
}

.campo-destaque .v-input__control .v-input__slot {
  background-color: #ffffff !important;
  border: 1px solid #90caf9;
  border-radius: 8px;
  min-height: 36px !important;
}

.campo-destaque .v-input__control {
  min-height: 36px !important;
}

.campo-destaque .v-text-field__details {
  padding-top: 2px !important;
  margin-bottom: 2px !important;
}

.py-1 {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.py-2 {
  padding-top: 8px !important;
  padding-bottom: 4px !important;
}

.pa-3 {
  padding: 8px !important;
}

.ma-0 {
  margin: 0 !important;
}

.text-center {
  text-align: center;
}
</style>