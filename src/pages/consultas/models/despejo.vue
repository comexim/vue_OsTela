<template>
	<div class="template-container">
		<v-card-title class="text-h6 text-center bg-blue-lighten-1 text-white">
			Operação de Despejo
		</v-card-title>
		<v-card-text class="pa-4">
			<v-form>
				<!-- OP -->
				<v-text-field
					v-model="despejo.op"
					label="OP"
					prepend-icon="mdi-file-document"
					variant="outlined"
					density="compact"
					class="mb-3"
					autocomplete="off"
					@input="onOpInput"
				></v-text-field>
				<!-- Lote -->
				<v-text-field
					v-model="despejo.lote"
					label="Lote"
					prepend-icon="mdi-package"
					variant="outlined"
					density="compact"
					class="mb-3"
					autocomplete="off"
					@input="onLoteInput"
				></v-text-field>
				<!-- Botão Buscar -->
				<div class="d-flex justify-center mb-4">
					<v-btn 
						color="blue" 
						variant="flat"
						prepend-icon="mdi-magnify"
						@click="buscarDados"
						:loading="loadingBuscar"
					>
						Buscar
					</v-btn>
				</div>
				<!-- Tabela de Endereços do Despejo -->
				<div class="mb-4" v-if="movEnderData && movEnderData.length > 0">
					<v-divider class="mb-3"></v-divider>
					<h4 class="text-subtitle-1 mb-2">Endereços Encontrados</h4>
					<div class="table-scroll">
						<v-data-table
							v-model="despejo.enderecosSelecionados"
							:headers="headersDespejo"
							:items="movEnderData"
							item-value="id"
							show-select
							density="compact"
							class="elevation-1 mb-3"
							hide-default-footer
							:items-per-page="-1"
						>
							<template v-slot:top>
								<v-toolbar flat density="compact">
															<v-toolbar-title class="text-subtitle-2">
																OP: {{ despejo.op }} - Lote: {{ despejo.lote }} | Sacas: {{ totalSacas.toFixed(2) }}
															</v-toolbar-title>
								</v-toolbar>
							</template>
						</v-data-table>
					</div>
				</div>
				<!-- Mensagem quando não há dados após busca -->
				<v-alert
					v-else-if="!loadingBuscar && (despejo.op || despejo.lote) && movEnderData.length === 0"
					type="info"
					text
					density="compact"
					class="mb-4"
				>
					Nenhum endereço encontrado para os parâmetros informados.
				</v-alert>
				<!-- Moegas (Seleção Múltipla) -->
				<v-select
					v-model="despejo.moegas"
					label="Moegas"
					prepend-icon="mdi-grain"
					:items="listamoegas"
					item-title="enderCod"
					item-value="enderBloco"
					variant="outlined"
					density="compact"
					class="mb-4"
					multiple
					chips
					closable-chips
					:loading="loadingMoegas"
				>
				</v-select>
				<!-- Empilhadeiras -->
				<v-select
					v-model="despejo.empilhadeira"
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
			<!-- Botão gerar ordem -->
			<div class="d-flex justify-center">
				<v-btn 
					color="blue" 
					variant="flat" 
					size="large"
					prepend-icon="mdi-plus-circle"
					@click="gerarOrdemDespejo"
					:loading="loadingGerarOrdem"
				>
					Gerar Ordem de Despejo
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
import { ref, onMounted, defineEmits, computed } from 'vue';
// Computed para somar todas as sacas dos endereços encontrados
const totalSacas = computed(() => {
	if (!movEnderData.value || movEnderData.value.length === 0) return 0;
	return movEnderData.value
		.filter(item => despejo.value.enderecosSelecionados.includes(item.id))
		.reduce((acc, item) => acc + ((item.bagKgAtu || 0) / 59), 0);
});

import { enderColor } from '../../../stores/Consultas/getEnderColor'; 
import { empilhadeira } from '../../../stores/Consultas/getEmpilhadeira';
import { moegas } from '../../../stores/Consultas/getMoega';
import { ordemDespejoOP } from '../../../stores/Consultas/postOrdemDespejo';
import { listaBag } from '../../../stores/Consultas/getListaBag';

const emit = defineEmits(['ordem-enviada']);

// Store
const enderColorStore = enderColor();
const empilhadeiraStore = empilhadeira();
const moegasStore = moegas();
const ordemDespejoStore = ordemDespejoOP();
const listaBagStore = listaBag();

// Estados dos formulários
const despejo = ref({
	op: '',
	lote: '',
	empilhadeira: null,
	moegas: null,
	enderecosSelecionados: []
});

// Estados de loading
const loadingEmpilhadeiras = ref(false);
const loadingBuscar = ref(false);
const loadingMoegas = ref(false);
const loadingGerarOrdem = ref(false);

// Estado para mensagem de resultado
const mensagemResultado = ref({
	mostrar: false,
	tipo: 'success',
	titulo: '',
	texto: ''
});

// Dados
const movEnderData = ref([]);
const empilhadeiras = ref([]); 
const listamoegas = ref([]);

// Headers das tabelas
const headersDespejo = ref([
	{ title: 'Endereço', key: 'enderCod', sortable: true },
	{ title: 'Lote', key: 'bagLote', sortable: false }
]);

// Função para enriquecer dados do lote com informações da API getListaBag
async function enriquecerDadosLote(lote) {
	try {
		if (!lote.bagLote) return lote;
		
		const dadosCompletos = await listaBagStore.listaBag({ lote: lote.bagLote });
		
		if (dadosCompletos && Array.isArray(dadosCompletos) && dadosCompletos.length > 0) {
			// Filtra os dados para pegar apenas o lote que corresponde ao enderCod atual
			const dadosLoteFiltrado = dadosCompletos.find(item => 
				item.bagAtuEnder === lote.enderCod || 
				item.enderCod === lote.enderCod
			);
			
			// Se não encontrar correspondência exata, pega o primeiro resultado como fallback
			const dadosLote = dadosLoteFiltrado || dadosCompletos[0];
			
			return {
				...lote,
				bagKgAtu: dadosLote.bagKgAtu || 0,
				bagTag: dadosLote.bagTag || lote.bagTag || ''
			};
		}
		
		return lote;
	} catch (error) {
		console.error(`Erro ao buscar dados para o lote ${lote.bagLote}:`, error);
		return lote;
	}
}

// Função para obter a descrição completa da moega
const obterDescricaoMoega = (valorMoega) => {
	if (!valorMoega || !listamoegas.value) return '';
	
	const moegaEncontrada = listamoegas.value.find(moega => 
		moega.enderBloco === valorMoega
	);
	
	return moegaEncontrada ? moegaEncontrada.enderCod : valorMoega;
};
const onOpInput = () => {
	if (despejo.value.op) {
		despejo.value.lote = '';
		// Limpa dados da busca anterior
		movEnderData.value = [];
		despejo.value.enderecosSelecionados = [];
	}
};

const onLoteInput = () => {
	if (despejo.value.lote) {
		despejo.value.op = '';
		// Limpa dados da busca anterior
		movEnderData.value = [];
		despejo.value.enderecosSelecionados = [];
	}
};

// Funções do Despejo
const buscarDados = async () => {
	loadingBuscar.value = true;
	try {
		const params = {};
		if (despejo.value.op) params.op = despejo.value.op;
		if (despejo.value.lote) params.lote = despejo.value.lote;
		if (!params.op && !params.lote) {
			movEnderData.value = [];
			loadingBuscar.value = false;
			return;
		}
		const response = await enderColorStore.enderColor(params);
		if (response) {
			// Mapeia os dados e adiciona um ID único para cada item
			const dadosBasicos = (Array.isArray(response) ? response : [response]).map((item, index) => ({
				...item,
				id: `${item.enderCod}-${item.bagLote || ''}-${index}`
			}));
			
			// Enriquece cada lote com dados da API getListaBag (apenas se tiver bagLote)
			const dadosEnriquecidos = await Promise.all(
				dadosBasicos.map(async (lote) => {
					if (lote.bagLote) {
						return await enriquecerDadosLote(lote);
					}
					return lote;
				})
			);
			
			movEnderData.value = dadosEnriquecidos;
			console.log('Dados enriquecidos do despejo:', dadosEnriquecidos);
			
			// Seleciona todos os endereços retornados
			despejo.value.enderecosSelecionados = movEnderData.value.map(item => item.id);
		} else {
			movEnderData.value = [];
			despejo.value.enderecosSelecionados = [];
		}
	} catch (error) {
		console.error('Erro ao buscar dados:', error);
		movEnderData.value = [];
		despejo.value.enderecosSelecionados = [];
	} finally {
		loadingBuscar.value = false;
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

const carregarMoegas = async () => {
	loadingMoegas.value = true;
	try {
		const dados = await moegasStore.moegas();
		listamoegas.value = Array.isArray(dados) ? dados : [];
	} catch (error) {
		console.error('Erro ao carregar moegas:', error);
	} finally {
		loadingMoegas.value = false;
	}
};

const gerarOrdemDespejo = async () => {
	// Validação da empilhadeira (sempre obrigatória)
	if (!despejo.value.empilhadeira) {
		console.warn('Empilhadeira é obrigatória');
		mensagemResultado.value = {
			mostrar: true,
			tipo: 'error',
			titulo: 'Erro de Validação!',
			texto: 'Empilhadeira é obrigatória'
		};
		return;
	}

	// Para despejo por Lote, endereços selecionados são obrigatórios
	if (despejo.value.lote && despejo.value.enderecosSelecionados.length === 0) {
		console.warn('Para despejo por Lote, pelo menos um endereço deve ser selecionado');
		mensagemResultado.value = {
			mostrar: true,
			tipo: 'error',
			titulo: 'Erro de Validação!',
			texto: 'Para despejo por Lote, pelo menos um endereço deve ser selecionado'
		};
		return;
	}

	// Verifica se tem OP ou Lote para enviar
	if (!despejo.value.op && !despejo.value.lote) {
		console.warn('OP ou Lote é obrigatório para gerar ordem de despejo');
		mensagemResultado.value = {
			mostrar: true,
			tipo: 'error',
			titulo: 'Erro de Validação!',
			texto: 'OP ou Lote é obrigatório para gerar ordem de despejo'
		};
		return;
	}

	// Validação específica para Lote: moegas são obrigatórias
	if (despejo.value.lote && (!despejo.value.moegas || despejo.value.moegas.length === 0)) {
		console.warn('Para operações com Lote, pelo menos uma Moega é obrigatória');
		mensagemResultado.value = {
			mostrar: true,
			tipo: 'error',
			titulo: 'Erro de Validação!',
			texto: 'Para operações com Lote, pelo menos uma Moega é obrigatória'
		};
		return;
	}

	loadingGerarOrdem.value = true;

	try {
		let response;

		if (despejo.value.op) {
			// Formato para OP
			// Pega a moega selecionada (primeira, se múltipla)
			const moegaSelecionada = despejo.value.moegas && despejo.value.moegas.length > 0
				? obterDescricaoMoega(despejo.value.moegas[0])
				: null;

			// Se não houver moega selecionada, retorna erro
			if (!moegaSelecionada) {
				mensagemResultado.value = {
					mostrar: true,
					tipo: 'error',
					titulo: 'Erro de Validação!',
					texto: 'Selecione uma Moega para enviar a ordem de despejo por OP.'
				};
				loadingGerarOrdem.value = false;
				return;
			}

			// Monta o payload conforme solicitado
			const payloadOP = {
				op: despejo.value.op,
				empicod: despejo.value.empilhadeira,
				listaEnder: [
					{
						EnderCod: moegaSelecionada
					}
				]
			};

			console.log('Enviando dados da OP:', JSON.stringify(payloadOP, null, 2));
			response = await ordemDespejoStore.ordemDespejoOP(payloadOP);
			
		} else if (despejo.value.lote) {
			// Obter a descrição completa da primeira moega selecionada
			const descricaoMoegaDestino = despejo.value.moegas && despejo.value.moegas.length > 0 
				? obterDescricaoMoega(despejo.value.moegas[0]) 
				: "";

			// Formato para Lote
			const enderecosParaEnvio = movEnderData.value
				.filter(item => despejo.value.enderecosSelecionados.includes(item.id))
				.map(item => ({
					EmpiCod: despejo.value.empilhadeira,
					ItOsDestino: "",
					ItOsOrigem: item.enderCod,
					ItOsObs: "",
					ItOsPeso: item.bagKgAtu || "",
					ItOsTagBag: item.bagTag || "",
					Lote: item.bagLote,
					MotCod: "",
					OpTck: "",
					OSID: "",
					Prioridade: "0",
					Sequencia: ""
				}));

			const payloadLote = {
                listaEnder: [
                    {
                        EnderCod: descricaoMoegaDestino
                    }
                ],
				wms_itemos: enderecosParaEnvio,
				wms_os: {
					MotCod: "",
					OSBlocoSuger: "",
					OsStatus: "AB"
				}
			};

			console.log('Enviando dados do Lote:', JSON.stringify(payloadLote, null, 2));
			response = await ordemDespejoStore.ordemDespejoLote(payloadLote);
		}
		
		console.log('Resposta da API:', response);

		// Verifica se a resposta foi bem-sucedida
		if (response && (response.code === 600 || response.success)) {
			// Exibe mensagem de sucesso
			mensagemResultado.value = {
				mostrar: true,
				tipo: 'success',
				titulo: 'Sucesso!',
				texto: `${response.message || 'Ordem de despejo gerada com sucesso!'} ${response.data ? `- Ordem: ${response.data}` : ''}`
			};
			
			// Limpa o formulário após sucesso
			despejo.value = {
				op: '',
				lote: '',
				empilhadeira: null,
				moegas: null,
				enderecosSelecionados: []
			};
			movEnderData.value = [];
		} else {
			// Exibe mensagem de erro se o código não for 600
			mensagemResultado.value = {
				mostrar: true,
				tipo: 'error',
				titulo: 'Erro!',
				texto: `${response?.message || 'Erro ao gerar ordem de despejo'} ${response?.code ? `- Código: ${response.code}` : ''}`
			};
		}

		// Emite o evento de sucesso/erro
		emit('ordem-enviada', { 
			response: response,
			success: response && (response.code === 600 || response.success),
			message: response?.message || 'Operação realizada'
		});

	} catch (error) {
		console.error('Erro ao gerar ordem de despejo:', error);
		
		// Exibe mensagem de erro
		mensagemResultado.value = {
			mostrar: true,
			tipo: 'error',
			titulo: 'Erro de Comunicação!',
			texto: 'Não foi possível gerar a ordem de despejo. Tente novamente.'
		};
		
		emit('ordem-enviada', { 
			error: 'Erro ao gerar ordem de despejo: ' + error.message,
			success: false
		});
	} finally {
		loadingGerarOrdem.value = false;
	}
};

onMounted(() => {
	carregarEmpilhadeiras();
	carregarMoegas();
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
.table-scroll {
	max-height: 300px;
	overflow-y: auto;
	overflow-x: hidden;
}
</style>
