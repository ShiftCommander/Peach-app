window.addEventListener('DOMContentLoaded', () => {
  const dial = document.querySelector('.dial');
  const wheel = document.getElementById('chromatic-wheel');
  if (!dial || !wheel || document.querySelector('.dial-lens')) return;

  const lens = document.createElement('div');
  lens.className = 'dial-lens';
  lens.setAttribute('aria-hidden', 'true');

  const lensWheel = document.createElement('div');
  lensWheel.id = 'chromatic-wheel-lens';
  lensWheel.className = 'chromatic-wheel chromatic-wheel--lens';
  lens.appendChild(lensWheel);

  const glass = document.querySelector('.dial-glass');
  const bezel = document.querySelector('.dial-bezel-light');
  if (bezel) {
    dial.insertBefore(lens, bezel);
  } else if (glass) {
    glass.insertAdjacentElement('afterend', lens);
  } else {
    dial.appendChild(lens);
  }

  const cloneMarkup = () => {
    if (!wheel.children.length) return;
    lensWheel.innerHTML = wheel.innerHTML;
    lensWheel.querySelectorAll('.is-nearest').forEach((element) => {
      element.classList.remove('is-nearest');
    });
  };

  cloneMarkup();

  const observer = new MutationObserver(cloneMarkup);
  observer.observe(wheel, { childList: true });
});
