function showMessage() {
  const msg = document.getElementById('message');
  msg.classList.remove('hidden');
}

// BUG: showAlert no esta definida, el boton roto lanzara un ReferenceError
