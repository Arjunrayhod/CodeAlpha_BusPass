import { API_BASE_URL } from '../api';

export const downloadTicketPdf = (ticketId) => {
  if (!ticketId) return;
  const directUrl = `${API_BASE_URL}/api/ticket/pdf/${ticketId}?download=1`;
  window.location.href = directUrl;
};

export const openTicketPdfInBrowser = (ticketId) => {
  if (!ticketId) return;
  const directUrl = `${API_BASE_URL}/api/ticket/pdf/${ticketId}?download=0`;
  window.location.href = directUrl;
};

export const copyPdfLinkToClipboard = async (ticketId) => {
  if (!ticketId) return false;
  const directUrl = `${API_BASE_URL}/api/ticket/pdf/${ticketId}?download=1`;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(directUrl);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = directUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return true;
    }
  } catch (err) {
    console.error('Failed to copy PDF link:', err);
    return false;
  }
};

export const generateClientPassPdf = async (ticket) => {
  if (ticket && ticket.id) {
    downloadTicketPdf(ticket.id);
  }
  return true;
};





