function showMessage() {
  const msg = document.getElementById('message');
  msg.classList.remove('hidden');
}

function showAlert() {
  alert('¡Botón rojo clickeado!');
}

function shareUrl() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const msg = document.getElementById('message');
    msg.textContent = '¡URL copiada!';
    msg.classList.remove('hidden');
    setTimeout(() => {
      msg.classList.add('hidden');
      msg.textContent = 'Hola desde el boton que funciona!';
    }, 2000);
  }).catch(() => {
    alert('No se pudo copiar la URL');
  });
}
