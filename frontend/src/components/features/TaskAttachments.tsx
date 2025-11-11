import { Paperclip, Plus, Download, Trash2 } from 'lucide-react';
import TaskSubmission from './TaskSubmission';
import { formatFileSize } from '../../utils/taskUtils';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  uploadedBy: string;
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskAttachmentsProps {
  taskId: string;
  attachments?: Attachment[];
  currentUserId?: string;
  userRole?: string;
  onUploadClick: () => void;
  onDownload: (fileUrl: string, fileName: string) => void;
  onDelete: (attachmentId: string) => void;
  taskSubmission?: {
    content: string | null;
    submittedAt: string | null;
    submittedBy: string | null;
  };
  taskDueDate?: string | null;
  onSubmissionSuccess?: () => void;
}

export default function TaskAttachments({
  taskId,
  attachments,
  currentUserId,
  userRole,
  onUploadClick,
  onDownload,
  onDelete,
  taskSubmission,
  taskDueDate,
  onSubmissionSuccess,
}: TaskAttachmentsProps) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Paperclip className="w-5 h-5 mr-2" />
            Tệp đính kèm ({attachments?.length || 0})
          </h2>
          <button
            onClick={onUploadClick}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tải lên tệp
          </button>
        </div>
      </div>
      <div className="card-body">
        {/* Task Submission for Students */}
        {userRole === 'STUDENT' && (
          <div className="mb-6">
            <TaskSubmission 
              taskId={taskId} 
              onSubmissionSuccess={onSubmissionSuccess}
              currentSubmission={taskSubmission}
              taskDueDate={taskDueDate}
            />
          </div>
        )}

        {attachments && attachments.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{attachment.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(attachment.fileSize)} • Tải lên bởi {attachment.uploader.fullName}
                    </p>
                    {attachment.description && (
                      <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDownload(attachment.fileUrl, attachment.fileName)}
                    className="btn-ghost p-2 text-green-600 hover:text-green-800"
                    title="Tải xuống tệp"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {(userRole === 'ADMIN' || userRole === 'LECTURER' || attachment.uploadedBy === currentUserId) && (
                    <button
                      onClick={() => onDelete(attachment.id)}
                      className="btn-ghost p-2 text-red-600 hover:text-red-800"
                      title="Xóa tệp"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có tệp đính kèm</p>
            <p className="text-sm">Tải lên tệp để chia sẻ với nhóm của bạn</p>
          </div>
        )}
      </div>
    </div>
  );
}

