<template>
    <!-- Modal de acesso negado -->
    <v-dialog v-model="showAccessDenied" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 text-center">
          <v-icon color="red" size="large" class="mb-2">mdi-lock</v-icon>
          <br>
          Acesso Negado
        </v-card-title>
        <v-card-text class="text-center">
          Você não tem autorização para acessar esta funcionalidade.
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="secondary" @click="irParaHome" variant="outlined">
            <v-icon left>mdi-home</v-icon>
            Início
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Conteúdo principal (só exibe se autorizado) -->
    <div v-if="isAuthorized">
      <v-container class="centralizado">
        <v-card class="formulario-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <h1>Silos - Zerar Saldo</h1>
            <v-btn 
              icon 
              size="small" 
              @click="voltarDashboard"
              color="grey"
              variant="text"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          
          <v-card-text class="pa-3">
            <v-row>
              <v-col cols="12" class="py-1">
                <v-select
                  v-model="siloSelecionado"
                  :items="silos"
                  label="Silos"
                  item-title="nome"
                  item-value="codigo"
                  outlined
                  dense
                  class="campo-destaque"
                  @update:model-value="onSiloSelected"
                ></v-select>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" class="py-1">
                <v-text-field
                  v-model="lote"
                  label="Lote"
                  outlined
                  dense
                  readonly
                  class="campo-destaque"
                ></v-text-field>
            </v-col>
            </v-row>
            <v-row>
            <v-col cols="6" class="py-1">
              <v-text-field
                v-model="sacas"
                label="Sacas"
                outlined
                dense
                readonly
                class="campo-destaque"
              ></v-text-field>
            </v-col>
            <v-col cols="6" class="py-1">
              <v-text-field
                v-model="quantidade"
                label="Quantidade em KG"
                outlined
                dense
                readonly
                class="campo-destaque"
              ></v-text-field>
            </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="py-1">
                <v-text-field
                  v-model="observacao"
                  label="Observação"
                  outlined
                  dense
                  class="campo-destaque"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row class="ma-0">
              <v-col cols="12" class="text-center py-2">
                <v-btn color="red" class="white--text" @click="zerarSaldo">Zerar Saldo</v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-container>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BasePage from '@/components/BasePage.vue';
import { siloApp } from '../../stores/Consultas/getSiloApp';
import { setSiloSaldo } from '../../stores/Consultas/setSiloSaldo';

const router = useRouter();
const siloAppStore = siloApp();
const setSiloSaldoStore = setSiloSaldo();

const siloSelecionado = ref('');
const silos = ref([]);
const lote = ref('');
const quantidade = ref('');
const sacas = ref('');
const observacao = ref('');
const isAuthorized = ref(false);
const showAccessDenied = ref(false);

// Verifica autorização do usuário
const checkAuthorization = () => {
  try {
    const dataUser = localStorage.getItem('data');
    console.log('Data do usuário:', dataUser);
    
    if (dataUser === 'true') {
      isAuthorized.value = true;
      console.log('Usuário autorizado para acessar Silos');
    } else {
      isAuthorized.value = false;
      showAccessDenied.value = true;
      console.log('Usuário não autorizado para acessar Silos');
    }
  } catch (error) {
    console.error('Erro ao verificar autorização:', error);
    isAuthorized.value = false;
    showAccessDenied.value = true;
  }
};

// Função para ir para a home
const irParaHome = () => {
  showAccessDenied.value = false; // Fecha o modal primeiro
  router.push('/components/dashboard'); // Vai direto para o dashboard
};

// Função para voltar ao dashboard (botão X)
const voltarDashboard = () => {
  router.push('/components/dashboard');
};

// Função para calcular sacas baseado na quantidade, com separador de milhares e 2 casas decimais
const calcularSacas = (qtd) => {
  if (!qtd) return '0';
  let numero = typeof qtd === 'string'
    ? Number(qtd.replace(/\D/g, ''))
    : Number(qtd);
  if (isNaN(numero) || numero === 0) return '0';
  const resultado = numero / 59;
  // Formata para pt-BR: ponto para milhares, vírgula para decimais
  return resultado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Função para formatar números mantendo o valor original
const formatarNumero = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '0';
  const numero = Number(valor);
  if (isNaN(numero)) return '0';
  
  // Se for um número inteiro, exibe sem casas decimais
  if (numero % 1 === 0) {
    return numero.toString();
  }
  
  // Se tiver decimais, exibe com até 3 casas decimais (remove zeros à direita)
  return parseFloat(numero.toFixed(3)).toString();
};

const carregarSilos = async() => {
    try {
        const dados = await siloAppStore.siloApp();
        console.log('Dados recebidos da API:', dados);
        
        if (dados && dados.listaSilos && Array.isArray(dados.listaSilos)) {
            silos.value = dados.listaSilos.map(silo => ({
                codigo: silo.siloCod,
                nome: silo.siloCod,
                lote: silo.siloLote,
                quantidade: silo.siloSaldo
            }));
            console.log('Silos carregados:', silos.value);
        } else {
            console.warn('Dados de silos não encontrados ou formato inválido');
            silos.value = [];
        }
    } catch (error) {
        console.error('Erro ao carregar silos: ', error);
        silos.value = [];
    }
}

const onSiloSelected = () => {
    const siloEscolhido = silos.value.find(silo => silo.codigo === siloSelecionado.value);
    if (siloEscolhido) {
        lote.value = siloEscolhido.lote || '';
        const qtdOriginal = siloEscolhido.quantidade || 0;
        
        // Converte para número tratando string com ponto decimal
        let qtdNumerica;
        if (typeof qtdOriginal === 'string') {
            qtdNumerica = parseFloat(qtdOriginal.replace(/\s/g, '')) || 0;
        } else {
            qtdNumerica = Number(qtdOriginal) || 0;
        }
        
        quantidade.value = formatarNumero(qtdNumerica);
        sacas.value = calcularSacas(qtdOriginal); // Passa o valor original para calcularSacas
        
        console.log('Silo selecionado:', siloEscolhido);
        console.log('Quantidade original:', qtdOriginal);
        console.log('Quantidade numérica:', qtdNumerica);
        console.log('Quantidade formatada:', quantidade.value);
        console.log('Sacas calculadas:', sacas.value);
    } else {
        lote.value = '';
        quantidade.value = '';
        sacas.value = '';
    }
};

const zerarSaldo = async () => {
  try {
    if (!siloSelecionado.value) {
      alert('Por favor, selecione um silo.');
      return;
    }

    const siloEscolhido = silos.value.find(silo => silo.codigo === siloSelecionado.value);
    if (!siloEscolhido) {
      alert('Silo não encontrado.');
      return;
    }

    // Confirmação antes de zerar
    const confirmacao = confirm(`Tem certeza que deseja zerar o saldo do ${siloEscolhido.codigo}?\n\nLote: ${siloEscolhido.lote}\nQuantidade atual: ${quantidade.value} KG`);
    if (!confirmacao) {
      return; // Usuário cancelou
    }

    // Obtém data e hora atuais
    const now = new Date();
    const dataAtual = now.toLocaleDateString('pt-BR');
    const horaAtual = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Calcula a quantidade de movimento (inverso do saldo atual)
    const saldoAtual = Number(siloEscolhido.quantidade) || 0;
    const quantidadeMovimento = -saldoAtual; // Inverte o sinal para zerar

    const payload = {
      siloCod: siloEscolhido.codigo,
      movSiloSaldoAnt: saldoAtual,
      movSiloSaldoFim: 0, 
      movSiloQuant: quantidadeMovimento,
      movSiloData: dataAtual,
      movSiloHora: horaAtual,
      movSiloLote: localStorage.getItem('user'),
      movSiloObs: observacao.value
    };

    console.log('Enviando dados para zerar saldo:', payload);

    const response = await setSiloSaldoStore.setSiloSaldo(payload);
    console.log('Resposta da API:', response);

    if (response.code === 200 || response.type === "Success") {
      alert('Saldo zerado com sucesso!');
      
      // Recarrega os silos para atualizar os dados
      await carregarSilos();
      
      // Limpa os campos do formulário
      siloSelecionado.value = '';
      lote.value = '';
      quantidade.value = '';
      sacas.value = '';
      observacao.value = '';
    } else {
      alert(`Erro ao zerar saldo: ${response.message || 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error('Erro ao zerar saldo:', error);
    alert('Ocorreu um erro ao zerar o saldo. Verifique o console para mais detalhes.');
  }
};

onMounted(() => {
  // Verifica autorização primeiro
  checkAuthorization();
  
  // Só carrega os silos se o usuário estiver autorizado
  if (isAuthorized.value) {
    carregarSilos();
  } else {
    // Se não autorizado, redireciona após um delay
    setTimeout(() => {
      if (!isAuthorized.value && !showAccessDenied.value) {
        router.push('/components/dashboard'); // Volta para dashboard se o modal foi fechado sem ação
      }
    }, 5000); // 5 segundos
  }
});
</script>

<style scoped>
h1 {
  color: #2e7d32;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  margin: 0; /* Remove margem para alinhar corretamente */
}

.v-card-title {
  padding-bottom: 8px !important;
}

.centralizado {
  min-width: 500px;
  margin: 0 auto;
  padding: 15px;
}

.formulario-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid #e0e0e0;
  padding: 16px;
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