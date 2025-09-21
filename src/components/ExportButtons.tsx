import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell } from 'docx';

interface ExportButtonsProps {
  editor: Editor;
}

export const ExportButtons = ({ editor }: ExportButtonsProps) => {
  const exportToPDF = async () => {
    try {
      toast('Generating PDF...', { description: 'This may take a moment' });
      
      const editorElement = document.querySelector('.ProseMirror');
      if (!editorElement) return;

      const canvas = await html2canvas(editorElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20; // Account for margins

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      pdf.save('document.pdf');
      toast('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast('Failed to export PDF', { description: 'Please try again' });
    }
  };

  const exportToWord = async () => {
    try {
      toast('Generating Word document...', { description: 'This may take a moment' });

      const content = editor.getHTML();
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      
      const paragraphs: any[] = [];
      
      // Simple conversion - you might want to enhance this
      const processNode = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun(text)],
              })
            );
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: element.textContent || '',
                    bold: true,
                    size: element.tagName === 'H1' ? 32 : element.tagName === 'H2' ? 28 : 24,
                  }),
                ],
              })
            );
          } else if (element.tagName === 'P') {
            const textRuns: TextRun[] = [];
            const processTextNode = (textNode: Node) => {
              if (textNode.nodeType === Node.TEXT_NODE) {
                textRuns.push(new TextRun(textNode.textContent || ''));
              } else if (textNode.nodeType === Node.ELEMENT_NODE) {
                const textElement = textNode as Element;
                let isBold = false;
                let isItalic = false;
                let isUnderline = false;
                
                if (textElement.tagName === 'STRONG' || textElement.tagName === 'B') isBold = true;
                if (textElement.tagName === 'EM' || textElement.tagName === 'I') isItalic = true;
                if (textElement.tagName === 'U') isUnderline = true;
                
                textRuns.push(
                  new TextRun({
                    text: textElement.textContent || '',
                    bold: isBold,
                    italics: isItalic,
                    underline: isUnderline ? {} : undefined,
                  })
                );
              }
            };
            
            Array.from(element.childNodes).forEach(processTextNode);
            
            if (textRuns.length > 0) {
              paragraphs.push(new Paragraph({ children: textRuns }));
            }
          } else {
            Array.from(node.childNodes).forEach(processNode);
          }
        }
      };

      Array.from(doc.body.childNodes).forEach(processNode);

      const wordDoc = new Document({
        sections: [{
          properties: {},
          children: paragraphs.length > 0 ? paragraphs : [
            new Paragraph({
              children: [new TextRun('Empty document')],
            }),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(wordDoc);
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast('Word document exported successfully!');
    } catch (error) {
      console.error('Word export error:', error);
      toast('Failed to export Word document', { description: 'Please try again' });
    }
  };

  return (
    <div className="bg-editor-toolbar border-b border-editor-toolbar-border px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Export:</span>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToPDF}
          className="flex items-center gap-2"
        >
          <FileImage className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToWord}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Export Word
        </Button>
      </div>
    </div>
  );
};