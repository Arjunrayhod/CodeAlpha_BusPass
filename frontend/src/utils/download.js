import { API_BASE_URL } from '../api';

export const openTicketPdfInBrowser = (ticketId) => {
  if (!ticketId) return;
  const directUrl = `${API_BASE_URL}/api/ticket/pdf/${ticketId}?download=1`;
  try {
    const link = document.createElement('a');
    link.href = directUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    window.location.href = directUrl;
  }
};

export const downloadTicketPdf = (ticketId) => {
  openTicketPdfInBrowser(ticketId);
};

export const generateClientPassPdf = async (ticket) => {
  if (ticket && ticket.id) {
    openTicketPdfInBrowser(ticket.id);
  }
  return true;
};





