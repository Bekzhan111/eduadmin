/**
 * Safe clipboard utility that handles common clipboard errors
 */

export async function safeCopyToClipboard(text: string): Promise<boolean> {
  try {
    // Method 1: Modern Clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      console.log('✅ Copied using Clipboard API');
      return true;
    }
    
    // Method 2: Fallback for older browsers
    console.log('⚠️ Clipboard API not available, trying fallback...');
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.warn('❌ Clipboard API failed:', error);
    
    // Method 3: Last resort fallback
    return fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text: string): boolean {
  try {
    // Method 1: Try execCommand first
    if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible but accessible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.style.pointerEvents = 'none';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(textArea);
      
      // Focus and select
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      
      // Execute copy
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('✅ Copied using execCommand');
        return true;
      }
    }
    
    // Method 2: Try with visible input (for mobile)
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed';
    input.style.left = '50%';
    input.style.top = '50%';
    input.style.transform = 'translate(-50%, -50%)';
    input.style.zIndex = '9999';
    input.style.padding = '10px';
    input.style.border = '2px solid #007bff';
    input.style.borderRadius = '5px';
    input.style.background = 'white';
    
    document.body.appendChild(input);
    
    input.focus();
    input.select();
    input.setSelectionRange(0, 99999);
    
    const success = document.execCommand('copy');
    
    // Remove after short delay
    setTimeout(() => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    }, 100);
    
    if (success) {
      console.log('✅ Copied using visible input method');
      return true;
    }
    
    console.log('❌ All fallback methods failed');
    return false;
    
  } catch (error) {
    console.error('❌ Fallback copy failed:', error);
    return false;
  }
}

export function showCopyNotification(text: string, success: boolean) {
  // Create a modern toast notification instead of alert
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0 ${
    success 
      ? 'bg-green-500 text-white' 
      : 'bg-orange-500 text-white'
  }`;
  
  if (success) {
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <div class="font-medium">Скопировано!</div>
          <div class="text-sm opacity-90">${text.length > 20 ? text.substring(0, 20) + '...' : text}</div>
        </div>
      </div>
    `;
  } else {
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
        <div>
          <div class="font-medium">Не удалось скопировать</div>
          <div class="text-sm opacity-90 cursor-pointer" onclick="selectAndCopy(this)" data-text="${text}">
            Нажмите чтобы выделить: ${text.length > 15 ? text.substring(0, 15) + '...' : text}
          </div>
        </div>
      </div>
    `;
  }
  
  document.body.appendChild(notification);
  
  // Add helper function for manual selection
  if (!success && !(window as any).selectAndCopy) {
    (window as any).selectAndCopy = function(element: HTMLElement) {
      const text = element.getAttribute('data-text');
      if (text) {
        // Select the text for easy copying
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Try to copy again
        try {
          const copySuccess = document.execCommand('copy');
          if (copySuccess) {
            element.textContent = '✅ Скопировано!';
            element.style.color = '#10b981';
          }
        } catch (e) {
          // Show input field for manual copy
          const input = document.createElement('input');
          input.value = text;
          input.className = 'mt-2 p-2 border rounded w-full bg-white text-black';
          input.select();
          element.appendChild(input);
          element.textContent = 'Выделите и скопируйте:';
        }
      }
    };
  }
  
  // Auto-hide notification
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, success ? 3000 : 8000); // Show error notifications longer
} 