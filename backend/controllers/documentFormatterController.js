const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const mammoth = require('mammoth');
const pool = require('../db');
const { sendDocumentFormatterAccessRequestNotification } = require('../services/resendEmail');

const SUPPORTED_DOCUMENT_TYPES = new Set([
    'academic',
    'business',
    'apa',
    'mla',
    'chicago',
    'general',
    'edd_dissertation',
]);

const SUPPORTED_FONT_FAMILIES = new Set([
    'Times New Roman',
    'Arial',
    'Georgia',
    'Courier New',
]);

const SUPPORTED_LINE_SPACING = new Set(['single', '1.5', 'double']);

let ensureJobsTablePromise = null;
let ensureAccessRequestsTablePromise = null;

const normalizeText = (value) => String(value || '').replace(/\r\n/g, '\n').trim();
const normalizeOptionalText = (value) => {
    const normalized = String(value || '').trim();
    return normalized || null;
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim().toLowerCase());

const sanitizeFilename = (value) =>
    String(value || 'document')
        .replace(/[^a-z0-9-_]+/gi, '_')
        .replace(/^_+|_+$/g, '') || 'document';

const stripFormatting = (text) =>
    text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

const splitIntoParagraphs = (text) =>
    stripFormatting(text)
        .split(/\n\n+/)
        .map((paragraph) => paragraph.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean);

const getDocxSpacing = (lineSpacing) => {
    const map = { single: 240, '1.5': 360, double: 480 };
    return { line: map[lineSpacing] || 480, lineRule: 'auto' };
};

const getDocumentType = (value) => {
    const normalized = String(value || 'general').trim().toLowerCase();
    return SUPPORTED_DOCUMENT_TYPES.has(normalized) ? normalized : 'general';
};

const getFontFamily = (value) => {
    const normalized = String(value || 'Times New Roman').trim();
    return SUPPORTED_FONT_FAMILIES.has(normalized) ? normalized : 'Times New Roman';
};

const getLineSpacing = (value) => {
    const normalized = String(value || 'double').trim();
    return SUPPORTED_LINE_SPACING.has(normalized) ? normalized : 'double';
};

const getFontSize = (value) => {
    const amount = Number(value);
    if (Number.isNaN(amount)) {
        return 12;
    }

    return Math.min(16, Math.max(10, amount));
};

const getTodayLabel = (value) =>
    normalizeOptionalText(value) || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

const parseFormatRequest = (body = {}) => {
    const text = normalizeText(body.text);

    if (!text) {
        const error = new Error('Text is required before a document can be formatted.');
        error.statusCode = 400;
        throw error;
    }

    return {
        text,
        documentType: getDocumentType(body.documentType),
        title: normalizeOptionalText(body.title),
        author: normalizeOptionalText(body.author),
        date: getTodayLabel(body.date),
        fontFamily: getFontFamily(body.fontFamily),
        fontSize: getFontSize(body.fontSize),
        lineSpacing: getLineSpacing(body.lineSpacing),
    };
};

const formatAsPlainText = (options) => {
    const paragraphs = splitIntoParagraphs(options.text);
    const lines = [];

    if (options.documentType === 'academic' || options.documentType === 'apa' || options.documentType === 'edd_dissertation') {
        if (options.title) lines.push(options.title.toUpperCase());
        if (options.author) lines.push(`Author: ${options.author}`);
        lines.push(options.date);
        lines.push('');
        lines.push('');
    } else if (options.documentType === 'mla') {
        if (options.author) lines.push(options.author);
        lines.push('Professor [Name]');
        lines.push('[Course Name]');
        lines.push(options.date);
        lines.push('');
        if (options.title) lines.push(options.title);
        lines.push('');
    } else if (options.documentType === 'chicago') {
        if (options.title) lines.push(options.title);
        lines.push('');
        if (options.author) lines.push(options.author);
        lines.push(options.date);
        lines.push('');
    } else if (options.documentType === 'business') {
        if (options.title) lines.push(options.title);
        if (options.author) lines.push(`Prepared by: ${options.author}`);
        lines.push(options.date);
        lines.push('');
        lines.push('─'.repeat(60));
        lines.push('');
    } else {
        if (options.title) lines.push(options.title);
        if (options.author) lines.push(options.author);
        lines.push(options.date);
        lines.push('');
    }

    for (const paragraph of paragraphs) {
        lines.push(paragraph);
        lines.push('');
    }

    return lines.join('\n');
};

const buildDocxDocument = (options) => {
    const paragraphs = splitIntoParagraphs(options.text);
    const children = [];
    const fontSize = options.fontSize * 2;
    const spacing = getDocxSpacing(options.lineSpacing);

    if (options.documentType === 'academic' || options.documentType === 'apa' || options.documentType === 'edd_dissertation') {
        if (options.title) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: options.title, bold: true, font: options.fontFamily, size: fontSize + 2 })],
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing,
                }),
            );
        }

        if (options.author) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: options.author, font: options.fontFamily, size: fontSize })],
                    alignment: AlignmentType.CENTER,
                    spacing,
                }),
            );
        }

        children.push(
            new Paragraph({
                children: [new TextRun({ text: options.date, font: options.fontFamily, size: fontSize })],
                alignment: AlignmentType.CENTER,
                spacing,
            }),
        );
        children.push(new Paragraph({ children: [] }));
    } else if (options.documentType === 'mla') {
        if (options.author) {
            children.push(new Paragraph({ children: [new TextRun({ text: options.author, font: options.fontFamily, size: fontSize })], spacing }));
        }
        children.push(new Paragraph({ children: [new TextRun({ text: 'Professor [Name]', font: options.fontFamily, size: fontSize })], spacing }));
        children.push(new Paragraph({ children: [new TextRun({ text: '[Course Name]', font: options.fontFamily, size: fontSize })], spacing }));
        children.push(new Paragraph({ children: [new TextRun({ text: options.date, font: options.fontFamily, size: fontSize })], spacing }));
        if (options.title) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: options.title, font: options.fontFamily, size: fontSize, bold: true })],
                    alignment: AlignmentType.CENTER,
                    spacing,
                }),
            );
        }
    } else if (options.documentType === 'business') {
        if (options.title) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: options.title, bold: true, font: options.fontFamily, size: fontSize + 4 })],
                    alignment: AlignmentType.CENTER,
                    spacing,
                }),
            );
        }
        if (options.author) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: `Prepared by: ${options.author}`, font: options.fontFamily, size: fontSize })],
                    alignment: AlignmentType.CENTER,
                    spacing,
                }),
            );
        }
        children.push(
            new Paragraph({
                children: [new TextRun({ text: options.date, font: options.fontFamily, size: fontSize })],
                alignment: AlignmentType.CENTER,
                spacing,
            }),
        );
        children.push(new Paragraph({ children: [] }));
    } else {
        if (options.title) {
            children.push(
                new Paragraph({
                    children: [new TextRun({ text: options.title, font: options.fontFamily, size: fontSize, bold: true })],
                    alignment: AlignmentType.CENTER,
                    spacing,
                }),
            );
        }
        if (options.author) {
            children.push(new Paragraph({ children: [new TextRun({ text: options.author, font: options.fontFamily, size: fontSize })], spacing }));
        }
        if (options.title || options.author) {
            children.push(new Paragraph({ children: [] }));
        }
    }

    for (const paragraph of paragraphs) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: paragraph, font: options.fontFamily, size: fontSize })],
                spacing,
                indent: { firstLine: 720 },
            }),
        );
    }

    return new Document({
        sections: [
            {
                properties: {
                    page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
                },
                children,
            },
        ],
    });
};

async function buildPdfDocument(options) {
    const paragraphs = splitIntoParagraphs(options.text);
    const pdfDoc = await PDFDocument.create();
    const lineSpacing = options.lineSpacing === 'single' ? 1.2 : options.lineSpacing === '1.5' ? 1.8 : 2.4;

    let regularFont;
    let boldFont;

    if (options.fontFamily === 'Courier New') {
        regularFont = await pdfDoc.embedFont(StandardFonts.Courier);
        boldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);
    } else if (options.fontFamily === 'Arial') {
        regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    } else {
        regularFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    }

    const margin = 72;
    const fontSize = options.fontSize;
    const lineHeight = fontSize * lineSpacing;
    const indent = 36;

    let page = pdfDoc.addPage([612, 792]);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const usableWidth = pageWidth - margin * 2;
    let y = pageHeight - margin;

    const ensureSpace = (needed) => {
        if (y - needed < margin) {
            page = pdfDoc.addPage([612, 792]);
            y = pageHeight - margin;
        }
    };

    const drawLine = (text, { bold = false, center = false, size = fontSize, x = margin } = {}) => {
        const font = bold ? boldFont : regularFont;
        const textWidth = font.widthOfTextAtSize(text, size);
        const drawX = center ? margin + (usableWidth - textWidth) / 2 : x;
        ensureSpace(size + lineHeight);
        page.drawText(text, { x: drawX, y: y - size, size, font, color: rgb(0, 0, 0), maxWidth: usableWidth });
        y -= lineHeight;
    };

    const drawParagraph = (text) => {
        const words = text.split(/\s+/).filter(Boolean);
        let currentLine = '';
        const lines = [];

        for (const word of words) {
            const candidate = currentLine ? `${currentLine} ${word}` : word;
            if (regularFont.widthOfTextAtSize(candidate, fontSize) > usableWidth - indent && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = candidate;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        lines.forEach((line, index) => {
            ensureSpace(fontSize + 4);
            page.drawText(line, {
                x: index === 0 ? margin + indent : margin,
                y: y - fontSize,
                size: fontSize,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            y -= lineHeight;
        });

        y -= fontSize * 0.6;
    };

    if (options.title) {
        drawLine(options.title, { bold: true, center: true, size: fontSize + 2 });
    }

    if (options.author) {
        drawLine(options.documentType === 'business' ? `Prepared by: ${options.author}` : options.author, { center: true });
    }

    drawLine(options.date, { center: true });
    y -= fontSize;

    for (const paragraph of paragraphs) {
        drawParagraph(paragraph);
    }

    return pdfDoc.save();
}

const ensureJobsTable = async () => {
    if (!ensureJobsTablePromise) {
        ensureJobsTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS document_formatter_jobs (
                id BIGSERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                document_type TEXT NOT NULL,
                export_format TEXT NOT NULL,
                title TEXT,
                source_type TEXT NOT NULL DEFAULT 'text',
                input_filename TEXT,
                content_length INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `).catch((error) => {
            ensureJobsTablePromise = null;
            throw error;
        });
    }

    return ensureJobsTablePromise;
};

const ensureAccessRequestsTable = async () => {
    if (!ensureAccessRequestsTablePromise) {
        ensureAccessRequestsTablePromise = pool.query(`
            CREATE TABLE IF NOT EXISTS document_formatter_access_requests (
                id BIGSERIAL PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                organization TEXT,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `).catch((error) => {
            ensureAccessRequestsTablePromise = null;
            throw error;
        });
    }

    return ensureAccessRequestsTablePromise;
};

const logFormatterJob = async ({ userId, documentType, exportFormat, title, sourceType, inputFilename, contentLength }) => {
    try {
        await ensureJobsTable();
        await pool.query(
            `INSERT INTO document_formatter_jobs (
                user_id,
                document_type,
                export_format,
                title,
                source_type,
                input_filename,
                content_length
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                userId || null,
                documentType,
                exportFormat,
                title || null,
                sourceType || 'text',
                inputFilename || null,
                Number(contentLength || 0),
            ],
        );
    } catch (error) {
        console.error('Failed to log document formatter activity:', error);
    }
};
exports.healthCheck = async (_req, res) => {
    res.json({ status: 'ok', service: 'document-formatter' });
};

exports.getAdminOverview = async (_req, res) => {
    try {
        await Promise.all([ensureJobsTable(), ensureAccessRequestsTable()]);

        const [summaryResult, recentJobsResult, accessRequestsResult] = await Promise.all([
            pool.query(`
                SELECT
                    COUNT(*)::int AS total_jobs,
                    COUNT(*) FILTER (WHERE export_format = 'pdf')::int AS pdf_jobs,
                    COUNT(*) FILTER (WHERE export_format = 'docx')::int AS docx_jobs,
                    COUNT(*) FILTER (WHERE export_format = 'txt')::int AS txt_jobs,
                    COUNT(DISTINCT user_id)::int AS unique_users,
                    COALESCE(SUM(content_length), 0)::int AS total_characters,
                    MAX(created_at) AS last_job_at
                FROM document_formatter_jobs
            `),
            pool.query(`
                SELECT
                    j.id,
                    j.document_type,
                    j.export_format,
                    j.title,
                    j.source_type,
                    j.input_filename,
                    j.content_length,
                    j.created_at,
                    u.name AS user_name,
                    u.email AS user_email
                FROM document_formatter_jobs j
                LEFT JOIN users u ON u.id = j.user_id
                ORDER BY j.created_at DESC
                LIMIT 25
            `),
            pool.query(`
                SELECT id, user_id, name, email, organization, reason, status, created_at
                FROM document_formatter_access_requests
                ORDER BY created_at DESC
                LIMIT 20
            `),
        ]);

        res.json({
            summary: summaryResult.rows[0] || {
                total_jobs: 0,
                pdf_jobs: 0,
                docx_jobs: 0,
                txt_jobs: 0,
                unique_users: 0,
                total_characters: 0,
                last_job_at: null,
            },
            recentJobs: recentJobsResult.rows,
            accessRequests: accessRequestsResult.rows,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'admin_overview_failed',
            message: 'Unable to load the Document Formatter admin overview.',
        });
    }
};

exports.requestAccess = async (req, res) => {
    const name = normalizeOptionalText(req.body.name);
    const email = normalizeOptionalText(req.body.email)?.toLowerCase();
    const organization = normalizeOptionalText(req.body.organization);
    const reason = normalizeOptionalText(req.body.reason);

    if (!name) {
        return res.status(400).json({ error: 'invalid_name', message: 'Your name is required.' });
    }

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'invalid_email', message: 'A valid email address is required.' });
    }

    if (!reason) {
        return res.status(400).json({ error: 'invalid_reason', message: 'Please tell us why you need access.' });
    }

    try {
        await ensureAccessRequestsTable();

        const insertResult = await pool.query(
            `INSERT INTO document_formatter_access_requests (user_id, name, email, organization, reason)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, organization, reason, status, created_at`,
            [req.user?.id || null, name, email, organization, reason],
        );

        const emailResult = await sendDocumentFormatterAccessRequestNotification({
            name,
            email,
            organization,
            reason,
        });

        if (!emailResult.admin?.sent) {
            console.warn('Document Formatter access request email was not sent:', emailResult.admin?.error || emailResult.admin?.reason || 'Unknown email issue');
        }

        res.json({
            submitted: true,
            request: insertResult.rows[0],
            admin_email_sent: Boolean(emailResult.admin?.sent),
            customer_email_sent: Boolean(emailResult.customer?.sent),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'access_request_failed',
            message: 'Unable to submit the access request right now.',
        });
    }
};

exports.formatTxt = async (req, res) => {
    try {
        const options = parseFormatRequest(req.body);
        const formattedText = formatAsPlainText(options);

        await logFormatterJob({
            userId: req.user?.id,
            documentType: options.documentType,
            exportFormat: 'txt',
            title: options.title,
            sourceType: 'text',
            contentLength: options.text.length,
        });

        res.json({ formattedText });
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({
            error: 'formatting_failed',
            message: error.message || 'Unable to format the text document.',
        });
    }
};

exports.formatDocx = async (req, res) => {
    try {
        const options = parseFormatRequest(req.body);
        const document = buildDocxDocument(options);
        const buffer = await Packer.toBuffer(document);
        const filename = sanitizeFilename(options.title || 'formatted-document');

        await logFormatterJob({
            userId: req.user?.id,
            documentType: options.documentType,
            exportFormat: 'docx',
            title: options.title,
            sourceType: 'text',
            contentLength: options.text.length,
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({
            error: 'formatting_failed',
            message: error.message || 'Unable to generate the Word document.',
        });
    }
};

exports.formatPdf = async (req, res) => {
    try {
        const options = parseFormatRequest(req.body);
        const pdfBytes = await buildPdfDocument(options);
        const filename = sanitizeFilename(options.title || 'formatted-document');

        await logFormatterJob({
            userId: req.user?.id,
            documentType: options.documentType,
            exportFormat: 'pdf',
            title: options.title,
            sourceType: 'text',
            contentLength: options.text.length,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        console.error(error);
        res.status(error.statusCode || 500).json({
            error: 'formatting_failed',
            message: error.message || 'Unable to generate the PDF document.',
        });
    }
};

exports.extractUploadedText = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'no_file', message: 'No file was uploaded.' });
    }

    const { buffer, originalname } = req.file;
    const extension = originalname.split('.').pop()?.toLowerCase() || '';

    try {
        let extractedText = '';
        let fileType = extension;

        if (extension === 'docx') {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = normalizeText(result.value);
            fileType = 'docx';
        } else if (extension === 'txt') {
            extractedText = normalizeText(buffer.toString('utf-8'));
            fileType = 'txt';
        } else {
            return res.status(400).json({
                error: 'unsupported_type',
                message: 'Unsupported file type. Please upload a .docx or .txt file.',
            });
        }

        if (!extractedText) {
            return res.status(422).json({
                error: 'empty_document',
                message: 'No text could be extracted from this file. It may be empty.',
            });
        }

        await logFormatterJob({
            userId: req.user?.id,
            documentType: 'general',
            exportFormat: 'extract',
            title: null,
            sourceType: fileType,
            inputFilename: originalname,
            contentLength: extractedText.length,
        });

        return res.json({ text: extractedText, filename: originalname, fileType });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'extraction_failed',
            message: error.message || 'Failed to extract text from the file.',
        });
    }
};