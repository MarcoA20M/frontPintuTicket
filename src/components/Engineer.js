import React from 'react';

const Engineer = () => {
	return (
		<div style={{ textAlign: 'center', marginTop: '60px' }}>
			<h1>¡Bienvenido Ingeniero!</h1>
			<p>Esta es tu vista personalizada.</p>
			<button onClick={() => alert('¡Botón presionado!')}>Continuar</button>
		</div>
	);
};

export default Engineer;
