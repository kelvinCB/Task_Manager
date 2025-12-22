import { describe, it, expect } from 'vitest';
import { extractAttachments, formatDescriptionWithAttachments, Attachment } from '../../utils/attachmentUtils';

describe('attachmentUtils', () => {
    describe('extractAttachments', () => {
        it('should return empty text and attachments for empty description', () => {
            const result = extractAttachments('');
            expect(result).toEqual({ text: '', attachments: [] });
        });

        it('should extract a single attachment', () => {
            const description = 'Some task description.\n**Attachment:** [test.png](http://example.com/test.png)';
            const result = extractAttachments(description);

            expect(result.text).toBe('Some task description.');
            expect(result.attachments).toHaveLength(1);
            expect(result.attachments[0]).toEqual({
                name: 'test.png',
                url: 'http://example.com/test.png',
                type: 'image'
            });
        });

        it('should extract multiple attachments', () => {
            const description = `
Here is a task.
**Attachment:** [doc.pdf](http://site.com/doc.pdf)
More text.
**Attachment:** [video.mp4](http://site.com/video.mp4)
      `.trim();

            const result = extractAttachments(description);

            expect(result.text).toBe('Here is a task.\nMore text.');
            expect(result.attachments).toHaveLength(2);
            expect(result.attachments[0]).toEqual({ name: 'doc.pdf', url: 'http://site.com/doc.pdf', type: 'file' });
            expect(result.attachments[1]).toEqual({ name: 'video.mp4', url: 'http://site.com/video.mp4', type: 'video' });
        });

        it('should not extract malformed attachment lines', () => {
            const description = 'Check this: [link](url)';
            const result = extractAttachments(description);

            expect(result.text).toBe('Check this: [link](url)');
            expect(result.attachments).toHaveLength(0);
        });
    });

    describe('formatDescriptionWithAttachments', () => {
        it('should combine text and attachments correctly', () => {
            const text = 'My Task Details';
            const attachments: Attachment[] = [
                { name: 'image.png', url: 'http://img.com', type: 'image' }
            ];

            const result = formatDescriptionWithAttachments(text, attachments);
            expect(result).toBe('My Task Details\n\n**Attachment:** [image.png](http://img.com)');
        });

        it('should handle empty attachments', () => {
            const text = 'Just text';
            const result = formatDescriptionWithAttachments(text, []);
            expect(result).toBe('Just text');
        });

        it('should handle empty text with attachments', () => {
            const attachments: Attachment[] = [
                { name: 'file.txt', url: 'http://url.com', type: 'file' }
            ];
            const result = formatDescriptionWithAttachments('', attachments);
            expect(result).toBe('**Attachment:** [file.txt](http://url.com)');
        });
    });
});
