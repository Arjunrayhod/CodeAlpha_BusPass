import api, { API_BASE_URL } from '../api';

export const downloadTicketPdf = async (ticketId, customName) => {
  const filename = customName || ('CloudBus_Pass_BP' + String(ticketId).padStart(6, '0') + '.pdf');
  const directUrl = API_BASE_URL + '/api/ticket/pdf/' + ticketId + '?download=1';

  try {
    const res = await api.get('/ticket/pdf/' + ticketId + '?download=1', {
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (err) {
    console.warn('Direct blob download error, triggering browser direct download:', err);
    window.location.href = directUrl;
  }
};

