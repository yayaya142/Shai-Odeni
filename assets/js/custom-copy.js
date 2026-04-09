document.addEventListener('DOMContentLoaded', () => {
  const copyText = async text => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
      document.body.removeChild(textarea);
  };

  const flashSuccess = button => {
    const icon = button.querySelector('i');
    if (!icon) return;

    const originalClass = icon.className;
    const originalTitle = button.getAttribute('data-bs-original-title');
    const successTitle = button.getAttribute('data-title-succeed') || 'Copied!';

    icon.className = 'fas fa-check';
    button.setAttribute('data-bs-original-title', successTitle);

    const reset = () => {
      icon.className = originalClass;
      if (originalTitle === null) {
        button.removeAttribute('data-bs-original-title');
      } else {
        button.setAttribute('data-bs-original-title', originalTitle);
      }
    };

    window.setTimeout(reset, 2000);
  };

  const buttons = document.querySelectorAll('.code-header > button');

  buttons.forEach(button => {
    button.addEventListener('click', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const code = button.parentElement?.nextElementSibling?.querySelector('code');
      if (!code) return;

      const text = code.innerText.replace(/\n$/, '');

      try {
        await copyText(text);
        flashSuccess(button);
      } catch (error) {
        console.error('Copy failed:', error);
      }
    });
  });

  const shareButton = document.getElementById('copy-link');

  if (!shareButton) return;

  shareButton.addEventListener(
    'click',
    async event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        await copyText(window.location.href);
        flashSuccess(event.currentTarget);
      } catch (error) {
        console.error('Share copy failed:', error);
      }
    },
    true
  );
});
