export interface Attachment {
    name: string;
    url: string;
    type: 'image' | 'video' | 'file';
}

/**
 * Parses the description to extract attachments formatted as markdown links with a specific prefix.
 * Expected format: **Attachment:** [name](url)
 */
export const extractAttachments = (description: string): { text: string; attachments: Attachment[] } => {
    if (!description) {
        return { text: '', attachments: [] };
    }

    const attachments: Attachment[] = [];
    const lines = description.split('\n');
    const cleanLines: string[] = [];

    // Regex to match: **Attachment:** [name](url)
    // We make it slightly flexible with spaces
    const attachmentRegex = /^\s*\*\*Attachment:\*\*\s*\[(.*?)\]\((.*?)\)\s*$/;

    for (const line of lines) {
        const match = line.match(attachmentRegex);
        if (match) {
            const [, name, url] = match;
            const type = getAttachmentType(name);
            attachments.push({ name, url, type });
        } else {
            cleanLines.push(line);
        }
    }

    // Trim trailing newlines from the clean description to avoid growing whitespace
    let text = cleanLines.join('\n').trim();

    return { text, attachments };
};

/**
 * Recombines the clean description text with attachments formatted as markdown links.
 */
export const formatDescriptionWithAttachments = (text: string, attachments: Attachment[]): string => {
    let description = text.trim();

    if (attachments.length > 0) {
        if (description) {
            description += '\n\n';
        }

        const attachmentLines = attachments.map(att => `**Attachment:** [${att.name}](${att.url})`);
        description += attachmentLines.join('\n');
    }

    return description;
};

const getAttachmentType = (filename: string): 'image' | 'video' | 'file' => {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
        return 'image';
    }

    if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) {
        return 'video';
    }

    return 'file';
};
