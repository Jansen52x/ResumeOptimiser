// This requires the 'docx' library to be loaded globally via a script tag in index.html
declare const docx: any;

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // result contains the data as a base64 encoded string
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


export const generateAndDownloadDocx = async (content: string, filename: string): Promise<void> => {
    // Check if the docx library is loaded on the window object.
    if (typeof docx === 'undefined') {
        throw new Error('docx library is not loaded. Make sure it is included in your HTML file.');
    }

    // Destructure all necessary components from the global `docx` object here.
    // This is done inside the function to ensure the script has loaded before access.
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    // The markdown parser is now a local helper function within this scope.
    const parseMarkdownToDocx = (markdown: string) => {
        const lines = markdown.split('\n');
        const elements: any[] = [];

        lines.forEach(line => {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('# ')) {
                elements.push(new Paragraph({
                    text: trimmedLine.substring(2),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 200 },
                }));
            } else if (trimmedLine.startsWith('## ')) {
                elements.push(new Paragraph({
                    text: trimmedLine.substring(3),
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 180, before: 200 },
                }));
            } else if (trimmedLine.startsWith('### ')) {
                elements.push(new Paragraph({
                    text: trimmedLine.substring(4),
                    heading: HeadingLevel.HEADING_3,
                    style: "strong",
                    spacing: { after: 160, before: 180 },
                }));
            } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                elements.push(new Paragraph({
                    text: trimmedLine.substring(2),
                    bullet: {
                        level: 0
                    },
                }));
            } else if (trimmedLine === '') {
                elements.push(new Paragraph({ text: '' }));
            } else {
                // This block handles regular paragraphs and paragraphs with bold text.
                // We use the original `line` here to preserve any leading/trailing whitespace.
                const parts: any[] = [];
                const boldRegex = /\*\*(.*?)\*\*/g;
                let lastIndex = 0;
                let match;

                while ((match = boldRegex.exec(line)) !== null) {
                    // Add text before the bold part
                    if (match.index > lastIndex) {
                        parts.push(new TextRun(line.substring(lastIndex, match.index)));
                    }
                    // Add the bold part
                    parts.push(new TextRun({ text: match[1], bold: true }));
                    lastIndex = match.index + match[0].length;
                }

                // Add any remaining text after the last bold part
                if (lastIndex < line.length) {
                    parts.push(new TextRun(line.substring(lastIndex)));
                }

                if (parts.length > 0) {
                    elements.push(new Paragraph({ children: parts, spacing: { after: 120 } }));
                }
            }
        });

        return elements;
    };

    const docChildren = parseMarkdownToDocx(content);

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren,
        }],
        styles: {
            paragraphStyles: [
                {
                    id: "strong",
                    name: "Strong",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        bold: true,
                    },
                },
            ]
        }
    });

    const blob = await Packer.toBlob(doc);

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
