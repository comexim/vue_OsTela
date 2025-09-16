<template>
    <aside :class="{ 'is-expanded': is_expanded && !isLocked }" @mouseenter="!isLocked && (is_expanded = true)" @mouseleave="!isLocked && (is_expanded = false)" @click="handleSidebarClick">

        <div class="menu">
            <div v-for="item in menuItems" :key="item.name" class="menu-item">
                <button
                    @click="item.subpages.length ? toggleSubmenu(item.name) : navigate(item.path)"
                    @mouseenter="hoveredMenu = item.name"
                    @mouseleave="hoveredMenu = null"
                    :class="{ 'active': activeMenu === item.name || hoveredMenu === item.name }"
                >
                    <span class="material-icons">{{ item.icon }}</span>
                    <span v-if="is_expanded" class="menu-text">{{ item.name }}</span>
                </button>
                <transition name="submenu-fade">
                    <div v-if="activeMenu === item.name && item.subpages.length && is_expanded" class="submenu">
                        <button v-for="subpage in item.subpages" :key="subpage.name" class="submenu-item" @click="navigate(subpage.path)">
                            {{ subpage.name }}
                        </button>
                    </div>
                </transition>
            </div>
        </div>

        <div class="lock-button">
            <button @click="toggleLock">
                <span class="material-icons">{{ isLocked ? 'lock' : 'lock_open' }}</span>
            </button>
        </div>
    </aside>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const is_expanded = ref(false);
const router = useRouter();
const activeMenu = ref(null);
const hoveredMenu = ref(null);
const isLocked = ref(false);

const menuItems = [
  {
    name: 'Movimentos',
    icon: 'move_up',
    path: '/',
    subpages: [
      { name: 'Ordem de serviço', path: '/ordemservico' },
      { name: 'Guia de entrada', path: '/guiaentrada' },
      { name: 'OS X Moega', path: '/osxmoega' },
      { name: 'Apontamento Imãs', path: '/apontamentoimas' }
    ],
  },
  { name: 'Consultas',
    icon: 'search', 
    path: '/', 
    subpages: [
    { name: 'Mapa', path: '/consultas/mapa' }
  ] },
  { name: 'Relatórios', 
    icon: 'receipt_long', 
    path: '/settings', 
    subpages: [
      { name: 'Log Movimentações', path: '/logmov' },
      { name: 'Produção e parada por maquinário', path: '/prodparmaq' },
      { name: 'Apontamento Imãs', path: '/apontamentoimasrelatorio' },
    ] 
  },
];

const navigate = (path) => {
  router.push(path);
};

const toggleSubmenu = (menuName) => {
  activeMenu.value = activeMenu.value === menuName ? null : menuName;
};

const toggleLock = () => {
  isLocked.value = !isLocked.value;
  if (isLocked.value) {
    is_expanded.value = false;
  }
};

const handleSidebarInteraction = (event) => {
  if (isLocked.value && event.type === 'click') {
    is_expanded.value = true;
  }
};

const handleClickOutside = (event) => {
  const sidebar = document.querySelector('.menu');
  if (sidebar && !sidebar.contains(event.target)) {
    activeMenu.value = null;
  }
};

const handleSidebarClick = (event) => {
		const lockButton = event.target.closest('.lock-button');
		if (isLocked.value && !lockButton) {
			isLocked.value = false; // Destrava o cadeado ao clicar fora do botão de travar
		}
	};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('click', handleSidebarInteraction);
});
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('click', handleSidebarInteraction);
});
</script>

<style lang="scss" scoped>
aside {
  display: flex;
  flex-direction: column;
  width: calc(2rem + 28px);
  overflow: hidden;
  min-height: 100vh;
  padding: 0.5rem;

  background-color: transparent;
  color: var(--light);

  transition: width 0.3s ease;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;

  align-items: left; 

  &.is-expanded {
    width: var(--sidebar-width);
  }
  
  .menu {
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: flex-start;
    margin-top: 3.9rem; /* Adiciona um espaçamento superior para mover os itens para baixo */

    .menu-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 0;
      background: none;
      border: none;
      font-size: 1rem;
      border-radius: 0;
      box-shadow: none;

      button {
        background: none;
        border: none;
        color: var(--dark);
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0.1rem 0rem 0.5rem 0.6rem;
        text-align: left;
        width: 100%;
        border-radius: 50px;
        box-shadow: none;
        transition: background-color 0.2s;
        display: flex;
        align-items: center; /* Garante que o texto fique alinhado ao lado do ícone */
        gap: 0.5rem; /* Espaço entre o ícone e o texto */

        span.material-icons {
          display: inline-block;
          margin-top: 0.2rem; /* Adiciona um espaçamento para mover os ícones para baixo */
        }

        &:hover {
          background-color: var(--primary);
        }

        &.active {
          background-color: var(--primary);
          color: #000000;
        }
      }
    }

    .submenu {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin-left: 1.8rem;
      border-left: 2px solid var(--primary);
      padding-left: 0.5rem;
      gap: 0.2rem;
      overflow: hidden;
      max-height: none;
      opacity: 1;
      transition: none;

      .submenu-item {
        background: none;
        border: none;
        color: #000; /* Alterado para preto para maior contraste */
        cursor: pointer;
        font-size: 0.9rem; /* Aumentado o tamanho da fonte */
        font-weight: bold; /* Tornar o texto mais destacado */
        padding: 0.3rem 0.6rem; /* Ajuste no espaçamento interno */
        text-align: left;
        width: 100%;
        border-radius: 4px; /* Adicionado borda arredondada para destaque */
        box-shadow: none;
        transition: background-color 0.2s, color 0.2s;
        position: relative;
        overflow: visible;

        &::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 0;
          background: var(--primary);
          transition: width 0.3s ease cubic-bezier(0.4, 0, 0.2, 1);
        }
      &:hover {
        background-color: transparent;
        text-decoration: none;
      }
        &:hover::after {
          width: 100%;
        }
      }
    }
  }

  .lock-button {
    position: fixed; /* Torna o botão fixo na tela */
    bottom: 1rem;
    left: 0.6rem; /* Ajusta a posição para o canto inferior esquerdo */
    z-index: 100; /* Garante que o botão fique acima de outros elementos */

    button {
      background: var(--primary);
      border: none;
      color: #fff;
      border-radius: 50%;
      padding: 0.5rem;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: background-color 0.3s;

      &:hover {
        background: #2e7d32; /* Substituí lighten por uma cor fixa para evitar erros */
      }
    }
  }
}

.submenu-fade-enter-active, .submenu-fade-leave-active {
  transition: none;
}
.submenu-fade-enter-from, .submenu-fade-leave-to {
  max-height: 0;
  opacity: 0;
}
.submenu-fade-enter-to, .submenu-fade-leave-from {
  max-height: none;
  opacity: 1;
}
/* Espaçamento entre ícone e texto do menu */
.material-icons {
  vertical-align: middle;
}
.menu-text {
  margin-left: 1rem;
  vertical-align: middle;
}
</style>