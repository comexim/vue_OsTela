<template>
	<div class="base-page">
		<slot></slot>
	</div>
</template>

<script setup>
// Este componente é apenas um contêiner reutilizável
</script>

<style scoped>
.base-page {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	width: calc(100vw);
	box-sizing: border-box;
	padding: 1rem;
	background-color: #ece2e24f;
}

/* Mobile devices (smartphones) */
@media (max-width: 480px) {
	.base-page {
		padding: 1rem;
		margin-left: 10px;
		width: 80vw;
	}
}


/* Desktop/PC */
@media (min-width: 1500px) {
	.base-page {
		margin-left: -150px; /* Ajuste mais moderado para não ficar muito à direita */
	}
}
</style>
