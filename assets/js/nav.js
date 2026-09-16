// ============================================================================
// nav.js — Módulo de navegação
// Responsabilidade: sombra do cabeçalho ao rolar, menu mobile e dropdown.
// Não conhece nada sobre formulários, toasts ou modal.
// ============================================================================

/**
 * Inicializa todos os comportamentos de navegação do site.
 * Exportado para ser chamado pelo main.js no carregamento da página.
 */
export function initNav() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  /* ------------------------------------------------------------------ */
  /* Sombra do cabeçalho ao rolar                                        */
  /* ------------------------------------------------------------------ */
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Menu mobile (abre/fecha via botão hambúrguer)                       */
  /* ------------------------------------------------------------------ */
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Fecha o menu ao clicar em qualquer link dentro dele
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Submenu dropdown "Projetos": sincroniza aria-expanded com hover/foco */
  /* ------------------------------------------------------------------ */
  const dropdown = document.querySelector('.nav__dropdown');
  if (dropdown) {
    const trigger = dropdown.querySelector('a');
    const setExpanded = (value) => trigger.setAttribute('aria-expanded', String(value));

    dropdown.addEventListener('mouseenter', () => setExpanded(true));
    dropdown.addEventListener('mouseleave', () => setExpanded(false));
    dropdown.addEventListener('focusin', () => setExpanded(true));
    dropdown.addEventListener('focusout', (event) => {
      if (!dropdown.contains(event.relatedTarget)) setExpanded(false);
    });
  }
}