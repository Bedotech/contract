document.addEventListener('selectionchange', () => {
  const selection = document.getSelection();
  const selectedText = selection.toString();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (selectedText) {
    window.top.postMessage({
      type: 'selection',
      text: selectedText,
      parentNode: selection.parentNode,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    }, '*');
  }
})
