// ============================================================================
// feedback.js — Módulo de componentes de feedback
// Responsabilidade: toasts, modal e alerts.
// Exporta showToast() e openModal() para uso por outros módulos (ex.: forms.js).
// ============================================================================

/* Ícones usados em toasts e modal, por variante */
const ICONS = { success: '✓', warning: '!', danger: '✕', info: 'i' };

/* Região fixa de toasts — criada uma única vez, na primeira chamada */
let toastRegion = null;

function ensureToastRegion() {
  if (toastRegion) return toastRegion;
  toastRegion = document.querySelector('.toast-region');
  if (!toastRegion) {
    toastRegion = document.createElement('div');
    toastRegion.className = 'toast-region';
    toastRegion.setAttribute('role', 'status');
    toastRegion.setAttribute('aria-live', 'polite');
    toastRegion.setAttribute('aria-atomic', 'false');
    document.body.appendChild(toastRegion);
  }
  return toastRegion;
}

/**
 * Exibe um toast na região fixa (canto inferior direito).
 * @param {Object} opts
 * @param {'success'|'warning'|'danger'|'info'} [opts.variant='info']
 * @param {string} [opts.title]
 * @param {string} [opts.text]
 * @param {number} [opts.duration=5000] — ms; 0 = não fecha sozinho
 * @returns {HTMLElement} o elemento do toast criado
 */
export function showToast({ variant = 'info', title = '', text = '', duration = 5000 } = {}) {
  const region = ensureToastRegion();
  const toast = document.createElement('div');
  toast.className = `toast toast--${variant}`;
  toast.setAttribute('role', variant === 'danger' ? 'alert' : 'status');

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${ICONS[variant] || ICONS.info}</span>
    <div class="toast__body">
      ${title ? `<strong class="toast__title">${title}</strong>` : ''}
      ${text ? `<p class="toast__text">${text}</p>` : ''}
    </div>
    <button type="button" class="toast__close" aria-label="Fechar notificação">×</button>
  `;

  const close = () => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  toast.querySelector('.toast__close').addEventListener('click', close);
  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  if (duration > 0) setTimeout(close, duration);
  return toast;
}

/* ------------------------------------------------------------------ */
/* Modal — elemento único no DOM, manipulado dinamicamente             */
/* ------------------------------------------------------------------ */
let lastFocused = null;

/**
 * Abre o modal com a configuração passada.
 * @param {Object} opts
 * @param {'success'|'warning'|'danger'|'info'} [opts.variant='info']
 * @param {string} [opts.title]
 * @param {string} [opts.desc]
 * @param {string} [opts.confirmText='Confirmar']
 * @param {string} [opts.cancelText='Cancelar']
 * @param {Function} [opts.onConfirm]
 */
export function openModal({
  variant = 'info',
  title = '',
  desc = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
} = {}) {
  const modal = document.getElementById('modal-feedback');
  if (!modal) return;

  lastFocused = document.activeElement;

  modal.className = `modal modal--${variant} is-open`;
  modal.querySelector('.modal__icon').textContent = ICONS[variant] || ICONS.info;
  modal.querySelector('.modal__title').textContent = title;
  modal.querySelector('.modal__desc').textContent = desc;

  const confirmBtn = modal.querySelector('[data-modal-confirm]');
  const cancelBtn  = modal.querySelector('[data-modal-cancel]');
  confirmBtn.textContent = confirmText;
  cancelBtn.textContent  = cancelText;

  // Clona os botões para remover listeners antigos antes de adicionar novos
  const newConfirm = confirmBtn.cloneNode(true);
  const newCancel  = cancelBtn.cloneNode(true);
  confirmBtn.replaceWith(newConfirm);
  cancelBtn.replaceWith(newCancel);

  newConfirm.addEventListener('click', () => {
    closeModal();
    if (typeof onConfirm === 'function') onConfirm();
  });
  newCancel.addEventListener('click', closeModal);
  modal.querySelector('.modal__overlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', onModalKeydown);

  setTimeout(() => newConfirm.focus(), 50);
}

/**
 * Fecha o modal e restaura o foco ao elemento que o abriu.
 */
export function closeModal() {
  const modal = document.getElementById('modal-feedback');
  if (!modal) return;
  modal.classList.remove('is-open');
  document.removeEventListener('keydown', onModalKeydown);
  if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
}

/**
 * Gerencia teclas dentro do modal: ESC fecha, TAB prende o foco.
 */
function onModalKeydown(event) {
  const modal = document.getElementById('modal-feedback');
  if (!modal) return;

  if (event.key === 'Escape') closeModal();

  if (event.key === 'Tab') {
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Inicialização dos componentes de demonstração (feedback.html)       */
/* ------------------------------------------------------------------ */
export function initFeedback() {
  /* Botões data-toast: disparam toasts variados */
  document.querySelectorAll('[data-toast]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const variant = btn.dataset.toast;
      const msgs = {
        success: { title: 'Tudo certo!', text: 'Seu cadastro foi enviado com sucesso.' },
        warning: { title: 'Atenção', text: 'Alguns campos precisam ser revisados.' },
        danger:  { title: 'Erro',     text: 'Não foi possível concluir a operação.' },
        info:    { title: 'Novidade', text: 'Novos projetos foram publicados.' },
      };
      showToast({ variant, ...(msgs[variant] || msgs.info) });
    });
  });

  /* Botões data-modal: abrem o modal com configuração por variante */
  document.querySelectorAll('[data-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const variant = btn.dataset.modal;
      const map = {
        success: { title: 'Cadastro confirmado', desc: 'Você receberá um e-mail com os próximos passos.', confirmText: 'Entendi' },
        warning: { title: 'Deseja sair sem enviar?', desc: 'As informações preenchidas serão perdidas.', confirmText: 'Sair', cancelText: 'Continuar editando' },
        danger:  { title: 'Excluir registro?', desc: 'Esta ação não pode ser desfeita.', confirmText: 'Excluir' },
      };
      const cfg = map[variant] || { title: 'Confirmação', desc: 'Deseja continuar?' };
      openModal({
        variant,
        ...cfg,
        onConfirm: () =>
          showToast({ variant: 'success', title: 'Ação concluída', text: 'O modal foi confirmado.' }),
      });
    });
  });

  /* Botões "X" dos alerts removem o alerta do DOM */
  document.querySelectorAll('.alert__close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alert = btn.closest('.alert');
      if (alert) alert.remove();
    });
  });
}