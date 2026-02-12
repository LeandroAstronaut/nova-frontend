import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera un PDF del pedido/presupuesto
 * @param {Object} order - Datos del pedido/presupuesto
 * @param {Object} company - Datos de la empresa
 */
export const generateOrderPDF = (order, company) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Colores
    const primaryColor = [102, 126, 234]; // #667eea
    const textColor = [51, 51, 51];
    const lightGray = [240, 240, 240];
    
    // Calcular totales
    const subtotal = order.items.reduce((acc, item) => {
        return acc + (item.quantity * item.listPrice);
    }, 0);
    
    const discountTotal = order.items.reduce((acc, item) => {
        const itemTotal = item.quantity * item.listPrice;
        return acc + (itemTotal * (item.discount || 0) / 100);
    }, 0);
    
    const globalDiscount = subtotal * (order.discount || 0) / 100;
    const total = subtotal - discountTotal - globalDiscount;
    
    // ENCABEZADO COMPACTO
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Nombre empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.name || 'NOVA Orden', margin, 18);
    
    // Tipo, número y fecha en una línea
    const typeLabel = order.type === 'budget' ? 'PRESUPUESTO' : 'PEDIDO';
    const dateStr = new Date(order.date).toLocaleDateString('es-AR');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${typeLabel} #${String(order.orderNumber).padStart(5, '0')} | Fecha: ${dateStr}`, margin, 28);
    
    // INFO CLIENTE Y VENDEDOR EN DOS COLUMNAS
    let currentY = 45;
    const colWidth = (pageWidth - (margin * 2) - 10) / 2;
    
    // Columna izquierda: Cliente
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE', margin, currentY);
    doc.setFont('helvetica', 'normal');
    
    const clientName = order.clientId?.businessName || 'N/A';
    doc.text(clientName.length > 30 ? clientName.substring(0, 30) + '...' : clientName, margin, currentY + 5);
    doc.setFontSize(8);
    doc.text(`CUIT: ${order.clientId?.cuit || '-'}`, margin, currentY + 10);
    
    // Columna derecha: Vendedor y Estado
    const rightColX = margin + colWidth + 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VENDEDOR', rightColX, currentY);
    doc.setFont('helvetica', 'normal');
    
    const sellerName = order.salesRepId?.firstName && order.salesRepId?.lastName 
        ? `${order.salesRepId.firstName} ${order.salesRepId.lastName}`
        : 'N/A';
    doc.text(sellerName, rightColX, currentY + 5);
    
    // Estado debajo
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO:', rightColX, currentY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(order.status.toUpperCase(), rightColX + 22, currentY + 12);
    
    // TABLA DE PRODUCTOS
    currentY = 70;
    
    const tableColumns = [
        { header: 'Producto', dataKey: 'name' },
        { header: 'Cant.', dataKey: 'quantity', align: 'center' },
        { header: 'Precio Unit.', dataKey: 'price', align: 'right' },
        { header: 'Desc.', dataKey: 'discount', align: 'center' },
        { header: 'Total', dataKey: 'total', align: 'right' }
    ];
    
    const tableData = order.items.map(item => {
        const itemTotal = item.quantity * item.listPrice * (1 - (item.discount || 0) / 100);
        return {
            name: item.productId?.name || item.name || 'Producto',
            quantity: item.quantity,
            price: `$${Number(item.listPrice).toLocaleString('es-AR')}`,
            discount: `${item.discount || 0}%`,
            total: `$${Number(itemTotal).toLocaleString('es-AR')}`
        };
    });
    
    autoTable(doc, {
        startY: currentY,
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 2
        },
        bodyStyles: {
            fontSize: 8,
            textColor: textColor,
            cellPadding: 2
        },
        alternateRowStyles: {
            fillColor: lightGray
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', fontStyle: 'bold', cellWidth: 30 }
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto'
    });
    
    // TOTALES COMPACTOS
    let finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 50;
    
    const totalsX = pageWidth - margin - 60;
    const valueX = pageWidth - margin;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Subtotal
    doc.text('Subtotal:', totalsX, finalY);
    doc.text(`$${Number(subtotal).toLocaleString('es-AR')}`, valueX, finalY, { align: 'right' });
    finalY += 5;
    
    // Descuentos en una línea si hay ambos
    if (discountTotal > 0 || order.discount > 0) {
        doc.setTextColor(16, 185, 129);
        let discountText = '';
        if (discountTotal > 0) discountText += `Items: -$${Number(discountTotal).toLocaleString('es-AR')}`;
        if (discountTotal > 0 && order.discount > 0) discountText += ' | ';
        if (order.discount > 0) discountText += `Global ${order.discount}%: -$${Number(globalDiscount).toLocaleString('es-AR')}`;
        doc.text(discountText, totalsX, finalY);
        doc.setTextColor(...textColor);
        finalY += 5;
    }
    
    // Línea separadora
    finalY += 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX, finalY, valueX, finalY);
    finalY += 7;
    
    // TOTAL FINAL
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, finalY);
    doc.setTextColor(...primaryColor);
    doc.text(`$${Number(total).toLocaleString('es-AR')}`, valueX, finalY, { align: 'right' });
    doc.setTextColor(...textColor);
    
    // NOTAS (compacto)
    if (order.notes) {
        finalY += 12;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Notas:', margin, finalY);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(order.notes, pageWidth - (margin * 2) - 20);
        doc.text(splitNotes, margin + 20, finalY);
    }
    
    // PIE DE PÁGINA
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`NOVA Orden - ${company?.name || ''} - ${new Date().getFullYear()}`, pageWidth / 2, footerY, { align: 'center' });
    
    // Generar nombre del archivo
    const fileName = `${typeLabel}_${String(order.orderNumber).padStart(5, '0')}_${clientName.replace(/\s+/g, '_')}.pdf`;
    
    // Abrir en nueva pestaña en lugar de descargar
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
};

export default generateOrderPDF;
