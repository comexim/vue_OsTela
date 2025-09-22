<template>
	<v-navigation-drawer v-model="isDrawerOpen" permanent :scrim="false">
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
			</v-list-group>
		</v-list>
	</v-navigation-drawer>

	<v-navigation-drawer
        v-model="wms"
        :location="isRightDrawer ? 'end' : 'start'"
        temporary
        :scrim="false"
        width="400"
      >
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-btn icon @click="toggleDrawerSide">
              <v-icon>{{ isRightDrawer ? 'mdi-arrow-left' : 'mdi-arrow-right' }}</v-icon>
            </v-btn>
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
            <WmsComponent :tipo="selectedTipo" />
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
							src="https://i.pinimg.com/originals/92/4a/56/924a567899367737564d02d562a91199.jpg" />
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsers } from '../stores/Auth/AuthLogin';
import WmsComponent from '../pages/consultas/components/wms.vue';

const router = useRouter();
const nomeUsuario = ref('');

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
  } catch (e) {
    console.error("Erro ao acessar o usuário do localStorage:", e);
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
const isRightDrawer = ref(false);

// Variáveis para o componente WMS
const selectedTipo = ref(null);
const tipoOptions = ['Remoção','Remoção OP', 'Despejo'];

const Movimentos = [
  ['Ordem de Serviço'],
  ['Guia de entrada'],
  ['OS X Moega'],
  ['Apontamento Imãs'],
];

const Consultas = [
  ['Mapa WMS'],
];

const Relatorios = [
  ['Log Movimentações'],
  ['Produção e Parada por maquinário'],
  ['Relatório Imas'],
];

const isMapaPage = computed(() => router.currentRoute.value.path === '/consultas/mapa');

function navigateTo(title) {
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
}

function toggleDrawerSide() {
  isRightDrawer.value = !isRightDrawer.value;
}
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
