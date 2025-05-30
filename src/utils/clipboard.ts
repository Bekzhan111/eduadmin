/**
 * Safe clipboard utility that handles common clipboard errors
 */

export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    // First try the modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers or non-secure contexts
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.warn('Clipboard API failed, falling back:', error);
    return fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text: string): boolean {
  try {
    // Create a temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make it invisible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    
    document.body.appendChild(textArea);
    
    // Focus and select the text
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices
    
    // Execute copy command
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

export function showCopyNotification(text: string, success: boolean) {
  if (success) {
    // You can replace this with a toast notification if you have one
    alert(`Successfully copied to clipboard: ${text}`);
  } else {
    // Show the text so user can copy manually
    alert(`Could not copy automatically. Please copy this manually: ${text}`);
  }
} 