import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
    history: createWebHistory(),
    routes: [
            {
                path: '/',
                component: () => import('../components/login.vue')
            },
            {
                path: '/consultas/mapa',
                component: () => import('../pages/consultas/mapa.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/movimentos/apontamentoImas',
                component: () => import('../pages/movimentos/apontamentoImas.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/relatorios/relatorioImas',
                component: () => import('../pages/relatorios/relatorioImas.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/movimentos/guiaEntrada',
                component: () => import('../pages/movimentos/guiaEntrada.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/relatorios/producaoParada',
                component: () => import('../pages/relatorios/producaoParada.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/relatorios/logMovimentos',
                component: () => import('../pages/relatorios/logMovimentos.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/movimentos/osXmoega',
                component: () => import('../pages/movimentos/osXmoega.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/movimentos/ordemServico',
                component: () => import('../pages/movimentos/ordemServico.vue'),
                meta: { requireAuth: true }
            }
    ]
})

router.beforeEach((to, from, next) => {
    if (to.meta.requireAuth) {
        const tokenCrp = localStorage.getItem('api_token');
        if(!tokenCrp) {
            next({ path: '/' });
        } else {
            next();
        }
    } else {
        next();
    }
})

export default router;