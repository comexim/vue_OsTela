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
                meta: { requireAuth: true, requiredPermission: 'MotDirImas' }
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
                meta: { requireAuth: true, requiredPermission: 'MotDirOsMoe' }
            },
            {
                path: '/movimentos/ordemServico',
                component: () => import('../pages/movimentos/ordemServico.vue'),
                meta: { requireAuth: true, requiredPermission: 'MotDirOS' }
            },
            {
                path: '/components/dashboard',
                component: () => import('../components/dashboard.vue'),
                meta: { requireAuth: true }
            },
            {
                path: '/movimentos/silos',
                component: () => import('../pages/movimentos/silos.vue'),
                meta: { requireAuth: true, requiredPermission: 'MotDirSilo' }
            },
            {
                path: '/relatorios/saldoSiloWMSXSUP',
                component: () => import('../pages/relatorios/saldoSiloWMSXSUP.vue'),
                meta: { requireAuth: true, requiredPermission: 'MotAdm'}
            }
    ]
})

router.beforeEach((to, from, next) => {
    if (to.meta.requireAuth) {
        const tokenCrp = localStorage.getItem('api_token');
        if(!tokenCrp) {
            next({ path: '/' });
        } else {
            // Verifica permissões específicas se necessário
            if (to.meta.requiredPermission) {
                const direitosStr = localStorage.getItem('userDireitos');
                if (direitosStr) {
                    try {
                        const direitos = JSON.parse(direitosStr);
                        const hasPermission = direitos[to.meta.requiredPermission] === 'S';
                        
                        if (!hasPermission) {
                            // Redireciona para a página de mapa ou dashboard
                            next({ path: '/consultas/mapa' });
                            return;
                        }
                    } catch (e) {
                        next({ path: '/' });
                        return;
                    }
                } else {
                    // Se não há direitos salvos, redireciona para login
                    next({ path: '/' });
                    return;
                }
            }
            next();
        }
    } else {
        next();
    }
})

export default router;