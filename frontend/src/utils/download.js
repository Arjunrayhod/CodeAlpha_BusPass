import { API_BASE_URL } from '../api';

export const downloadTicketPdf = (ticketId, customName) => {
  const filename = customName || (`CloudBus_Pass_BP${String(ticketId).padStart(6, '0')}.pdf`);
  const directUrl = `${API_BASE_URL}/api/ticket/pdf/${ticketId}?download=1`;

  try {
    const link = document.createElement('a');
    link.href = directUrl;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.warn('Anchor click error, falling back to direct navigation:', err);
    window.location.href = directUrl;
  }
};


