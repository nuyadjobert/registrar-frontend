import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfService {

  private loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  private addPageBorder(doc: jsPDF): void {
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);
  }

  private addHeader(doc: jsPDF, title: string, logoData: string): void {
    // Logo on the left
    doc.addImage(logoData, 'PNG', 14, 11, 30, 30);

    // School name centered
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Republic of the Philippines', 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Aces Tagum College', 105, 25, { align: 'center' });
    doc.text('Tagum City, Philippines | registrar@school.edu.ph', 105, 31, { align: 'center' });

    // Date issued top right
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const today = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Date Issued: ${today}`, 193, 18, { align: 'right' });

    // Divider line
    doc.setDrawColor(41, 98, 255);
    doc.setLineWidth(0.3);
    doc.line(14, 44, 196, 44);

    // Document title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 255);
    doc.text(title, 105, 53, { align: 'center' });
  }

  private addFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.3);
    doc.line(120, pageHeight - 30, 190, pageHeight - 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('School Registrar', 155, pageHeight - 25, { align: 'center' });
    doc.text('Signature over Printed Name', 155, pageHeight - 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${doc.getNumberOfPages()}`,
      105, pageHeight - 13,
      { align: 'center' }
    );
  }

  async generateCOR(data: any): Promise<void> {
    const doc = new jsPDF();
    const logoData = await this.loadImage('assets/images/atc-logo.png');

    // Academic year & semester
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const academicYear = month >= 6
      ? `${year}-${year + 1}`
      : `${year - 1}-${year}`;
    const semester = (month >= 6 && month <= 10)
      ? '1st Semester'
      : '2nd Semester';

    this.addPageBorder(doc);
    this.addHeader(doc, 'CERTIFICATE OF REGISTRATION', logoData);

    const margin = 20;
    const maxWidth = 148;

    // --- Student Info Block ---
    let y = 68;
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Student Name:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student, 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Student No:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student_number, 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Program:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.program, 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Academic Year:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${academicYear} — ${semester}`, 60, y);

    // --- Divider ---
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, 192, y);

    // --- Certification Paragraph ---
    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('TO WHOM IT MAY CONCERN:', margin, y);

    y += 10;
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const para1 =
      `This is to certify that ${data.student}, with Student No. ${data.student_number}, ` +
      `is officially enrolled and registered at Aces Tagum College for the ${semester} ` +
      `of Academic Year ${academicYear} under the program ${data.program}.`;

    const lines1 = doc.splitTextToSize(para1, maxWidth);
    doc.text(lines1, margin, y);
    y += lines1.length * 7 + 6;

    const para2 =
      `This certification is issued upon the request of the student concerned for ` +
      `whatever legal purpose it may serve.`;

    const lines2 = doc.splitTextToSize(para2, maxWidth);
    doc.text(lines2, margin, y);
    y += lines2.length * 7 + 14;

    // --- Issued at / Issued by ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const issuedDate = new Date().toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(`Issued at Tagum City, Philippines`, margin, y);
    y += 7;
    doc.text(`on ${issuedDate}.`, margin, y);

    this.addFooter(doc);

    const filename = `COR_${data.student_number}_${new Date().getFullYear()}.pdf`;
    doc.save(filename);
  }

  async generateTOR(data: any): Promise<void> {
    const doc = new jsPDF();
    const logoData = await this.loadImage('assets/images/atc-logo.png');

    this.addPageBorder(doc);
    this.addHeader(doc, 'TRANSCRIPT OF RECORDS (TOR)', logoData);

    // Student info
    let y = 68;
    const margin = 18;
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Student Name:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student, 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Student No:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.student_number, 60, y);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Program:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.program, 60, y);

    y += 14;

    autoTable(doc, {
      startY: y,
      head: [['Subject', 'Section', 'Grade', 'Remarks']],
      body: data.grades.map((g: any) => [
        g.subject, g.section, g.grade, g.remarks
      ]),
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [240, 244, 255],
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    this.addFooter(doc);

    const filename = `TOR_${data.student_number}_${new Date().getFullYear()}.pdf`;
    doc.save(filename);
  }
}