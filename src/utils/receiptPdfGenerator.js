import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { themeColors, getStatusText, formatCurrency } from './pdfStyles';

export const generateReceiptPDF = (receipt, options = {}) => {
    if (!receipt) {
        throw new Error('Receipt data is required');
    }

    const { 
        companyName = 'Nova', 
        companyAddress = '', 
        companyPhone = '', 
        companyEmail = '' 
    } = options;

    const doc = new jsPDF({
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let currentY = 20;

    // Colors
    const colors = {
        primary: [37, 99, 235],
        success: [34, 197, 94],
        danger: [239, 68, 68],
        warning: [245, 158, 11],
        gray: [107, 114, 128],
        darkGray: [55, 65, 81],
        lightGray: [243, 244, 246]
    };

    // Header background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Company info (top left)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, margin, currentY);

    currentY += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (companyAddress) {
        doc.text(companyAddress, margin, currentY);
        currentY += 5;
    }
    if (companyPhone) {
        doc.text(`Tel: ${companyPhone}`, margin, currentY);
        currentY += 5;
    }
    if (companyEmail) {
        doc.text(companyEmail, margin, currentY);
    }

    // Receipt title and number (top right)
    const rightX = pageWidth - margin;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO', rightX, 20, { align: 'right' });
    
    doc.setFontSize(24);
    doc.text(`#${String(receipt.receiptNumber).padStart(5, '0')}`, rightX, 32, { align: 'right' });

    // Status badge
    const statusText = receipt.status === 'activo' ? 'ACTIVO' : 'ANULADO';
    const statusColor = receipt.status === 'activo' ? colors.success : colors.danger;
    doc.setFillColor(...statusColor);
    doc.roundedRect(rightX - 35, 38, 35, 8, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, rightX - 17.5, 43, { align: 'center' });

    // Reset position for content
    currentY = 60;

    // Receipt Type
    doc.setFillColor(...colors.lightGray);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 20, 'F');
    
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TIPO DE RECIBO:', margin + 5, currentY + 8);
    
    const typeText = receipt.type === 'ingreso' ? 'INGRESO' : 'EGRESO';
    const typeColor = receipt.type === 'ingreso' ? colors.success : colors.warning;
    doc.setTextColor(...typeColor);
    doc.setFontSize(14);
    doc.text(typeText, margin + 5, currentY + 15);

    currentY += 30;

    // Client and Date Section
    const sectionTitle = (text, y) => {
        doc.setFillColor(...colors.primary);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.rect(margin, y, 80, 8, 'F');
        doc.text(text, margin + 4, y + 5.5);
    };

    // Client section
    sectionTitle('CLIENTE', currentY);
    currentY += 12;
    
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(receipt.clientId?.businessName || 'N/A', margin, currentY);
    
    if (receipt.clientId?.phone) {
        currentY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.gray);
        doc.text(`Tel: ${receipt.clientId.phone}`, margin, currentY);
    }

    if (receipt.clientId?.address) {
        currentY += 6;
        doc.text(receipt.clientId.address, margin, currentY);
    }

    // Date section (right side)
    const dateX = pageWidth - margin - 80;
    sectionTitle('FECHA', currentY - 12);
    
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(receipt.date).toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(dateStr, dateX, currentY);

    currentY += 25;

    // Amount Section
    doc.setFillColor(...colors.lightGray);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 30, 'F');
    
    doc.setTextColor(...colors.gray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTO:', margin + 10, currentY + 8);
    
    const amountColor = receipt.type === 'ingreso' ? colors.success : colors.warning;
    doc.setTextColor(...amountColor);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    const amountText = `${receipt.type === 'egreso' ? '-' : ''}${formatCurrency(receipt.amount)}`;
    doc.text(amountText, margin + 10, currentY + 24);

    currentY += 40;

    // Concept Section
    sectionTitle('CONCEPTO', currentY);
    currentY += 12;
    
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Handle long concept text
    const conceptLines = doc.splitTextToSize(receipt.concept || '', pageWidth - (margin * 2) - 10);
    doc.text(conceptLines, margin, currentY);
    currentY += (conceptLines.length * 6) + 15;

    // Payment Method
    sectionTitle('MÉTODO DE PAGO', currentY);
    currentY += 12;
    
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(11);
    const paymentMethod = receipt.paymentMethod 
        ? receipt.paymentMethod.charAt(0).toUpperCase() + receipt.paymentMethod.slice(1)
        : 'No especificado';
    doc.text(paymentMethod, margin, currentY);
    currentY += 20;

    // Notes if any
    if (receipt.notes) {
        sectionTitle('NOTAS', currentY);
        currentY += 12;
        
        doc.setTextColor(...colors.gray);
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(receipt.notes, pageWidth - (margin * 2) - 10);
        doc.text(noteLines, margin, currentY);
        currentY += (noteLines.length * 5) + 15;
    }

    // Sales Representative
    sectionTitle('VENDEDOR', currentY);
    currentY += 12;
    
    doc.setTextColor(...colors.darkGray);
    doc.setFontSize(11);
    const salesRepName = receipt.salesRepId 
        ? `${receipt.salesRepId.firstName} ${receipt.salesRepId.lastName}`
        : 'N/A';
    doc.text(salesRepName, margin, currentY);

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Footer line
    doc.setDrawColor(...colors.lightGray);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);

    // Footer text
    doc.setTextColor(...colors.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Este recibo fue generado electrónicamente por Nova.', pageWidth / 2, pageHeight - 25, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth / 2, pageHeight - 18, { align: 'center' });

    // Cancellation info if applicable
    if (receipt.status === 'anulado') {
        doc.addPage();
        currentY = 60;

        // Warning header
        doc.setFillColor(...colors.danger);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('RECIBO ANULADO', pageWidth / 2, 25, { align: 'center' });

        doc.setTextColor(...colors.danger);
        doc.setFontSize(14);
        doc.text(`Recibo #${String(receipt.receiptNumber).padStart(5, '0')}`, pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 25;
        
        doc.setTextColor(...colors.darkGray);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const cancelledDate = receipt.cancelledAt 
            ? new Date(receipt.cancelledAt).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Fecha no disponible';
        
        doc.text(`Fecha de anulación: ${cancelledDate}`, pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 15;
        
        const cancelledBy = receipt.cancelledBy 
            ? `${receipt.cancelledBy.firstName} ${receipt.cancelledBy.lastName}`
            : 'Usuario desconocido';
        doc.text(`Anulado por: ${cancelledBy}`, pageWidth / 2, currentY, { align: 'center' });

        if (receipt.cancellationReason) {
            currentY += 25;
            doc.setFillColor(...colors.lightGray);
            doc.rect(margin, currentY, pageWidth - (margin * 2), 50, 'F');
            
            doc.setTextColor(...colors.danger);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('MOTIVO DE ANULACIÓN:', margin + 10, currentY + 10);
            
            doc.setTextColor(...colors.darkGray);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            const reasonLines = doc.splitTextToSize(receipt.cancellationReason, pageWidth - (margin * 2) - 20);
            doc.text(reasonLines, margin + 10, currentY + 20);
        }
    }

    // Open in new tab instead of downloading
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
};
