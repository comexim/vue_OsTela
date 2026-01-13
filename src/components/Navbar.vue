<template>
  <v-navigation-drawer v-model="isDrawerOpen" :scrim="false" width="320" app>
		<v-list>
			<v-list-subheader>OSTela</v-list-subheader>

			<v-list-group value="Movimentos">
				<template v-slot:activator="{ props }">
					<v-list-item
						v-bind="props"
						title="Movimentos"
						prepend-icon="mdi-pin"
						class="text-left"
					/>
				</template>
				<v-list-item
					v-for="([title], i) in Movimentos"
					:key="i"
					:title="title"
					:value="title"
					class="text-left"
					@click="navigateTo(title)"
				/>
			</v-list-group>

			<v-list-group value="Consultas">
				<template v-slot:activator="{ props }">
					<v-list-item
						v-bind="props"
						title="Consultas"
						prepend-icon="mdi-map-search"
						class="text-left"
					/>
				</template>
				<v-list-item
					v-for="([title], i) in Consultas"
					:key="i"
					:title="title"
					:value="title"
					class="text-left"
					@click="navigateTo(title)"
				/>
			</v-list-group>

			<v-list-group value="Relatórios">
				<template v-slot:activator="{ props }">
					<v-list-item
						v-bind="props"
						title="Relatórios"
						prepend-icon="mdi-receipt-text"
						class="text-left"
					/>
				</template>
				<v-list-item
					v-for="([title], i) in Relatorios"
					:key="i"
					:title="title"
					:value="title"
					class="text-left"
          @click="navigateTo(title)"
				/>
				
				<v-list-group value="Conciliação" sub-group>
					<template v-slot:activator="{ props }">
						<v-list-item
							v-bind="props"
							title="Conciliação"
							prepend-icon="mdi-file-compare"
							class="text-left"
						/>
					</template>
					<v-list-item
						v-for="([title], i) in Conciliacao"
						:key="i"
						:title="title"
						:value="title"
						class="text-left pl-8"
						@click="navigateTo(title)"
					/>
				</v-list-group>
			</v-list-group>
		</v-list>
	</v-navigation-drawer>

	<v-navigation-drawer
        v-model="wms"
        temporary
        :scrim="false"
        width="380"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-spacer></v-spacer>
            <v-select
              v-model="selectedTipo"
              :items="tipoOptions"
              label="Tipo"
              variant="outlined"
              density="compact"
              style="max-width: 150px;"
              class="mx-15"
            ></v-select>
            <v-btn icon @click="wms = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="pa-0">
            <WmsComponent :tipo="selectedTipo" @filtrado="handleWMSFiltrado" />
          </v-card-text>
        </v-card>
      </v-navigation-drawer>

	<v-app-bar flat class="border-b">
		<v-app-bar-nav-icon @click="isDrawerOpen = !isDrawerOpen" />
		<v-btn v-if="isMapaPage" variant="tonal" color="blue" @click="wms = !wms">WMS</v-btn>
		<template #append>
			<v-menu>
				<template v-slot:activator="{ props }">
					<v-avatar v-bind="props">
						<v-img
							cover
							src="https://pluspng.com/img-png/user-png-icon-big-image-png-2240.png" />
					</v-avatar>
				</template>
				<v-card min-width="200px">
					<v-list>
						<v-btn prepend-icon="mdi-logout" variant="text" @click="logout" class="w-100">Sair</v-btn>
					</v-list>
				</v-card>
			</v-menu>
      <p v-if="nomeUsuario" class="nome-usuario">{{ nomeUsuario }}</p>
		</template>
	</v-app-bar>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUsers } from '../stores/Auth/AuthLogin';
import WmsComponent from '../pages/consultas/components/wms.vue';

const router = useRouter();
const nomeUsuario = ref('');
const dataUser = ref(localStorage.getItem('data') === 'true');
const userDireitos = ref({});

onMounted(() => {
  try {
    const user = localStorage.getItem('user');
    if (user) {
      // Tenta fazer o parse, mas usa o valor diretamente se não for JSON
      const parsedUser = user.startsWith('{') ? JSON.parse(user) : { name: user };
      nomeUsuario.value = parsedUser?.name || 'Usuário';
    } else {
      nomeUsuario.value = 'Usuário';
    }

    // Carrega os direitos do usuário
    const direitosStr = localStorage.getItem('userDireitos');
    if (direitosStr) {
      userDireitos.value = JSON.parse(direitosStr);
    }
  } catch (e) {
    nomeUsuario.value = 'Usuário';
  }
});

async function logout() {
  const usersStore = useUsers(); // Inicializa o Store
  await usersStore.logoutUser(); // Chama a action de logout
  router.push('/');
}

const isDrawerOpen = ref(false);
const wms = ref(false);

// Variáveis para o componente WMS
const selectedTipo = ref(null);

// Computed para filtrar tipos baseado nas permissões
const tipoOptions = computed(() => {
  const options = ['Filtro']; // Filtro sempre disponível
  
  // Adiciona as opções privadas apenas se o usuário tiver permissão
  if (hasPermission('MotDirRem')) {
    options.unshift('Remoção Lote', 'Remoção OP', 'Despejo');
  }
  
  return options;
});

// Função para verificar se o usuário tem permissão
const hasPermission = (permission) => {
  return userDireitos.value[permission] === 'S';
};

// Filtra os itens de Movimentos baseado nas permissões
const Movimentos = computed(() => {
  const items = [];
  
  if (hasPermission('MotDirOS')) {
    items.push(['Ordem de Serviço']);
  }
  
  // Guia de entrada não tem restrição específica mencionada, então sempre exibe
  items.push(['Guia de entrada']);
  
  if (hasPermission('MotDirOsMoe')) {
    items.push(['OS X Moega']);
  }
  
  if (hasPermission('MotDirImas')) {
    items.push(['Apontamento Imãs']);
  }
  
  if (hasPermission('MotDirSilo')) {
    items.push(['Zerar silos']);
  }
  
  return items;
});

const Consultas = [
  ['Mapa WMS'],
  ['Dashboard']
];

const Relatorios = [
  ['Log Movimentações'],
  ['Produção e Parada por maquinário'],
  ['Relatório Imas'],
  ['Saldo Silos (WMS X SUP)'],
  ['Acessos ao Sistema']
];

const Conciliacao = [
  ['Produção por data']
];

const isMapaPage = computed(() => router.currentRoute.value.path === '/consultas/mapa');

// Watch para monitorar abertura/fechamento do WMS
watch(wms, (newValue) => {
  // Emitir evento global para o mapa
  window.dispatchEvent(new CustomEvent('wms-toggle', { 
    detail: { isOpen: newValue } 
  }));
});

function navigateTo(title) {
  // Fecha o drawer antes de navegar
  isDrawerOpen.value = false;
  
  if (title === 'Mapa WMS') {
    router.push('/consultas/mapa');
  }
  if (title === 'Apontamento Imãs') {
    router.push('/movimentos/apontamentoImas');
  }
  if (title === 'Relatório Imas' || title === 'Relatório Imãs') { // Adiciona suporte para ambas as variações
    router.push('/relatorios/relatorioImas');
  }
  if (title === 'Guia de entrada') {
    router.push('/movimentos/guiaEntrada')
  }
  if (title === 'Produção e Parada por maquinário') {
    router.push('/relatorios/producaoParada')
  }
  if (title === 'Log Movimentações') {
    router.push('/relatorios/logMovimentos')
  }
  if (title === 'OS X Moega') {
    router.push('/movimentos/osXmoega')
  }
  if (title === 'Ordem de Serviço') {
    router.push('/movimentos/ordemServico')
  }
  if (title === 'Zerar silos') {
    router.push('/movimentos/silos')
  }
  if (title === 'Saldo Silos (WMS X SUP)') {
    router.push('/relatorios/saldoSiloWMSXSUP')
  }
  if (title === 'Produção por data') {
    router.push('/relatorios/producaoData')
  }
  if (title === 'Dashboard') {
    router.push('/consultas/dashboard')
  }
  if (title === 'Acessos ao Sistema') {
    router.push('/relatorios/acessos')
  }
}

// Função para lidar com filtrado do WMS
const handleWMSFiltrado = (enderCodList) => {
  // Emitir evento global para que o mapa possa escutar
  window.dispatchEvent(new CustomEvent('wms-filtrado', { 
    detail: { enderCods: enderCodList } 
  }));
};
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: var(--light, #857f7f);
  color: var(--light, #fff);
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 98;
}

.navbar-content {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 2rem;
  gap: 1rem;
}

/* Estilo para o nome do usuário */
.nome-usuario {
  font-weight: bold;
  padding: 30px;
  margin-top: 15px;
  font-size: 1.2rem;
}

.logout-btn {
  background: var(--primary, #2e7d32);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
}

.movimentos-group {
  position: relative;
  padding-left: 20px; /* Adiciona espaço para a linha */
}

.movimentos-group::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 20px; /* Ajusta a posição da linha para alinhar com os itens */
  width: 2px; /* Espessura da linha */
  height: 100%; /* Altura da linha */
  background-color: #2e7d32; /* Cor da linha */
}
</style>
