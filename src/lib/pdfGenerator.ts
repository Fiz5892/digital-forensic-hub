import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incident, Evidence } from './types';
import { format } from 'date-fns';

export const generateIncidentReport = (incident: Incident, evidence: Evidence[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(26, 54, 93); // Primary color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('DFIR INCIDENT REPORT', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Incident ID: ${incident.id}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Classification: CONFIDENTIAL`, pageWidth / 2, 35, { align: 'center' });

  yPos = 50;
  doc.setTextColor(0, 0, 0);

  // Incident Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 93);
  doc.text('INCIDENT SUMMARY', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const summaryData = [
    ['Title', incident.title],
    ['Type', incident.type],
    ['Priority', incident.priority.toUpperCase()],
    ['Status', incident.status.toUpperCase()],
    ['Reporter', incident.reporter.name],
    ['Assigned To', incident.assigned_to?.name || 'Unassigned'],
    ['Created', format(new Date(incident.created_at), 'PPpp')],
    ['Last Updated', format(new Date(incident.updated_at), 'PPpp')],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: summaryData,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    styles: { fontSize: 10, cellPadding: 2 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Description
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 93);
  doc.text('DESCRIPTION', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const splitDescription = doc.splitTextToSize(incident.description, pageWidth - 28);
  doc.text(splitDescription, 14, yPos);
  yPos += splitDescription.length * 5 + 10;

  // Technical Details
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 93);
  doc.text('TECHNICAL DETAILS', 14, yPos);
  yPos += 8;

  const technicalData = [
    ['Target URL', incident.technical_details.target_url],
    ['IP Address', incident.technical_details.ip_address],
    ['Server OS', incident.technical_details.server_os],
    ['Web Server', incident.technical_details.web_server],
    ['CMS', incident.technical_details.cms],
    ['Database', incident.technical_details.database],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: technicalData,
    theme: 'striped',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    styles: { fontSize: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Impact Assessment
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 93);
  doc.text('IMPACT ASSESSMENT', 14, yPos);
  yPos += 8;

  const impactData = [
    ['Confidentiality Impact', `${incident.impact_assessment.confidentiality}/5`],
    ['Integrity Impact', `${incident.impact_assessment.integrity}/5`],
    ['Availability Impact', `${incident.impact_assessment.availability}/5`],
    ['Business Impact', incident.impact_assessment.business_impact],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: impactData,
    theme: 'striped',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    styles: { fontSize: 10 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Timeline
  if (incident.timeline.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('INCIDENT TIMELINE', 14, yPos);
    yPos += 8;

    const timelineData = incident.timeline.map(event => [
      format(new Date(event.timestamp), 'PPpp'),
      event.type.toUpperCase(),
      event.event,
      event.user || '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Timestamp', 'Type', 'Event', 'User']],
      body: timelineData,
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 9 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Evidence Summary
  if (evidence.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('EVIDENCE SUMMARY', 14, yPos);
    yPos += 8;

    const evidenceData = evidence.map(e => [
      e.id,
      e.filename,
      e.hash_sha256.substring(0, 16) + '...',
      e.integrity_status.toUpperCase(),
      e.analysis_status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['ID', 'Filename', 'SHA-256', 'Integrity', 'Status']],
      body: evidenceData,
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Notes
  if (incident.notes.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 54, 93);
    doc.text('INVESTIGATION NOTES', 14, yPos);
    yPos += 8;

    const notesData = incident.notes.map(note => [
      format(new Date(note.created_at), 'PPpp'),
      note.category.toUpperCase(),
      note.content,
      note.created_by.name
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Category', 'Note', 'Author']],
      body: notesData,
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 93] },
      styles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 80 } }
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated by DFIR-Manager | ${format(new Date(), 'PPpp')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
};

export const downloadIncidentReport = (incident: Incident, evidence: Evidence[]) => {
  const doc = generateIncidentReport(incident, evidence);
  doc.save(`${incident.id}-report.pdf`);
};
