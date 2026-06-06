function showMessage() {
  const msg = document.getElementById('message');
  msg.classList.remove('hidden');
  
  const clickCount = document.getElementById('click-count');
  clickCount.textContent = parseInt(clickCount.textContent) + 1;
}

function showAlert() {
  alert('¡Botón rojo clickeado!');
}
