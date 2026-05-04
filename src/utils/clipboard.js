// Clipboard utility that works on both HTTPS and HTTP (non-secure contexts)
// navigator.clipboard requires secure context (HTTPS or localhost)
// This fallback uses the older execCommand API for HTTP contexts

export const copyToClipboard = async (text) => {
  // Try modern API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fall through to fallback
    }
  }

  // Fallback for non-secure contexts (HTTP, network IPs)
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.error('Clipboard fallback failed:', e);
    return false;
  }
};
