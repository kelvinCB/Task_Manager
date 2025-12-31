import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentList } from '../../components/AttachmentList';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { Attachment } from '../../utils/attachmentUtils';

const mockAttachments: Attachment[] = [
  {
    name: 'document.pdf',
    url: 'https://example.com/document.pdf',
    type: 'file',
  },
  {
    name: 'image.jpg',
    url: 'https://example.com/image.jpg',
    type: 'image',
  },
  {
    name: 'video.mp4',
    url: 'https://example.com/video.mp4',
    type: 'video',
  },
];

const renderAttachmentList = (props: any = {}) => {
  const defaultProps = {
    attachments: mockAttachments,
    readonly: false,
    onDelete: vi.fn(),
    ...props,
  };

  return render(
    <ThemeProvider>
      <AttachmentList {...defaultProps} />
    </ThemeProvider>
  );
};

describe('AttachmentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when attachments array is empty', () => {
    const { container } = render(
      <ThemeProvider>
        <AttachmentList attachments={[]} />
      </ThemeProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all attachments', () => {
    renderAttachmentList();

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
  });

  it('should display correct type labels', () => {
    renderAttachmentList();

    const attachmentItems = screen.getAllByTestId('attachment-item');
    expect(attachmentItems).toHaveLength(3);

    expect(screen.getByText('file')).toBeInTheDocument();
    expect(screen.getByText('image')).toBeInTheDocument();
    expect(screen.getByText('video')).toBeInTheDocument();
  });

  it('should render view links for all attachments', () => {
    renderAttachmentList();

    const viewLinks = screen.getAllByTestId('attachment-view-link');
    expect(viewLinks).toHaveLength(3);

    expect(viewLinks[0]).toHaveAttribute('href', mockAttachments[0].url);
    expect(viewLinks[1]).toHaveAttribute('href', mockAttachments[1].url);
    expect(viewLinks[2]).toHaveAttribute('href', mockAttachments[2].url);
  });

  it('should render download buttons for all attachments', () => {
    renderAttachmentList();

    const downloadButtons = screen.getAllByTestId('attachment-download-btn');
    expect(downloadButtons).toHaveLength(3);
  });

  it('should render delete buttons when not readonly', () => {
    renderAttachmentList({ readonly: false });

    const deleteButtons = screen.getAllByTestId('attachment-delete-btn');
    expect(deleteButtons).toHaveLength(3);
  });

  it('should not render delete buttons in readonly mode', () => {
    renderAttachmentList({ readonly: true, onDelete: undefined });

    expect(screen.queryByTestId('attachment-delete-btn')).not.toBeInTheDocument();
  });

  it('should call onDelete with correct index when delete button clicked', () => {
    const onDelete = vi.fn();
    renderAttachmentList({ onDelete });

    const deleteButtons = screen.getAllByTestId('attachment-delete-btn');
    fireEvent.click(deleteButtons[1]); // Delete second attachment

    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('should render image preview for image attachments', () => {
    renderAttachmentList();

    const images = screen.getAllByRole('img');
    const imageAttachment = images.find(img => img.getAttribute('src') === mockAttachments[1].url);
    
    expect(imageAttachment).toBeInTheDocument();
    expect(imageAttachment).toHaveAttribute('alt', 'image.jpg');
  });
});
