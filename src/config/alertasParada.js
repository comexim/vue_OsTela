export const REGRAS_ALERTA_PARADA = [
    {
        maquinas: ['001', '002'], // Eletrônicas 1 e 2
        limitesPorMotivo: {
            N32: 20, //Setup,
            N05: 50, //Aguardando juntar café ventilado
            N12: 40, //Balão de catato cheio
            N13: 40, //Balão de resíduo cheio
        },
    },
];