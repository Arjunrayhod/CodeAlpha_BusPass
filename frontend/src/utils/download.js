import { jsPDF } from 'jspdf';
import { API_BASE_URL } from '../api';

export const generateClientPassPdf = async (ticket) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Blue Header Background
    doc.setFillColor(30, 58, 138); // #1E3A8A
    doc.roundedRect(15, 15, 180, 26, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CLOUDBUS TRANSIT SYSTEM', 105, 26, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL DIGITAL BUS PASS & BOARDING TICKET', 105, 34, { align: 'center' });

    // 2. Pass Ribbon
    const passLabel = (ticket.pass_type || 'SINGLE').toUpperCase() + ' JOURNEY PASS';
    doc.setFillColor(239, 246, 255); // #EFF6FF
    doc.roundedRect(15, 45, 180, 10, 2, 2, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`PASS CATEGORY: ${passLabel}`, 105, 51.5, { align: 'center' });

    // 3. Ticket ID & Status Box
    doc.setFillColor(243, 244, 246);
    doc.rect(15, 59, 180, 12, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(15, 59, 180, 12, 'S');

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`TICKET ID: #BP-${String(ticket.id).padStart(6, '0')}`, 20, 66.5);

    doc.setTextColor(5, 150, 105);
    doc.text(`STATUS: CONFIRMED & ACTIVE`, 105, 66.5, { align: 'center' });

    doc.setTextColor(31, 41, 55);
    doc.text(`TRAVEL DATE: ${ticket.travel_date}`, 190, 66.5, { align: 'right' });

    // 4. Passenger & Journey Details Table
    doc.setFillColor(219, 234, 254);
    doc.rect(15, 76, 90, 8, 'F');
    doc.rect(105, 76, 90, 8, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(10);
    doc.text('PASSENGER DETAILS', 20, 81.5);
    doc.text('TRANSIT & CORRIDOR DETAILS', 110, 81.5);

    // Details Rows
    doc.setFillColor(249, 250, 251);
    doc.rect(15, 84, 90, 52, 'F');
    doc.rect(105, 84, 90, 52, 'F');
    doc.rect(15, 84, 90, 52, 'S');
    doc.rect(105, 84, 90, 52, 'S');

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Left Column (Passenger)
    doc.text(`Name:`, 20, 92);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticket.user_name}`, 40, 92);

    doc.setFont('helvetica', 'normal');
    doc.text(`Email:`, 20, 101);
    doc.text(`${ticket.user_email}`, 40, 101);

    doc.text(`User ID:`, 20, 110);
    doc.text(`#${ticket.user_id}`, 40, 110);

    if (ticket.student_id_number) {
      doc.setTextColor(180, 83, 9);
      doc.text(`Student ID:`, 20, 119);
      doc.text(`${ticket.student_id_number} (50% Off)`, 42, 119);
      doc.setTextColor(55, 65, 81);
    } else {
      doc.text(`Pass Validity:`, 20, 119);
      doc.text(`${ticket.travel_date}`, 45, 119);
    }

    doc.text(`Fare Paid:`, 20, 128);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87);
    doc.text(`Rs. ${(ticket.amount_paid || ticket.price || 0).toFixed(2)}`, 40, 128);

    // Right Column (Journey)
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(`Route:`, 110, 92);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticket.source} -> ${ticket.destination}`, 125, 92);

    doc.setFont('helvetica', 'normal');
    doc.text(`Departure:`, 110, 101);
    doc.text(`${ticket.departure_time || '07:00 AM'}`, 130, 101);

    doc.text(`Distance:`, 110, 110);
    doc.text(`${ticket.distance_km || 250} km (AC Express)`, 130, 110);

    doc.text(`Assigned Seat:`, 110, 121);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216);
    doc.text(`SEAT #${ticket.seat_number}`, 140, 122);

    // 5. QR Code Section
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.rect(15, 142, 180, 48, 'S');

    try {
      const qrImgUrl = `${API_BASE_URL}/api/ticket/qr/${ticket.id}`;
      const imgRes = await fetch(qrImgUrl);
      const blob = await imgRes.blob();
      const reader = new FileReader();
      const base64Data = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      doc.addImage(base64Data, 'PNG', 20, 146, 40, 40);
    } catch (e) {
      console.warn("Could not embed QR image:", e);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('CONDUCTOR INSPECTION & BOARDING TERMS:', 68, 152);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1. Present this digital pass or QR code to the bus conductor upon boarding.', 68, 160);
    doc.text('2. Keep your Govt/Student ID handy for verification if concession was applied.', 68, 166);
    doc.text('3. This pass is strictly non-transferable and valid for the assigned journey.', 68, 172);
    doc.text('4. Inquiries & Helpdesk: support@cloudbus.com | Helpline: 1800-CLOUDBUS', 68, 178);

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text('Generated by CloudBus Transit Engine | Created by Arjun Rathod | CodeAlpha Transit System', 105, 202, { align: 'center' });

    // Trigger instant client-side file save!
    doc.save(`CloudBus_Pass_BP${String(ticket.id).padStart(6, '0')}.pdf`);
    return true;
  } catch (err) {
    console.error("Client PDF generation error, using fallback URL:", err);
    window.location.href = `${API_BASE_URL}/api/ticket/pdf/${ticket.id}?download=1`;
    return false;
  }
};

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
    window.location.href = directUrl;
  }
};



