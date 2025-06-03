import type { Attachment } from "../../helpers/types";
import CustomImage from "./CustomImage";


const MessageAttachments: React.FC<{ attachments: Attachment[] }> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-4">
      {/* Header */}
      <div className="flex items-center mb-3">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center mr-2">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
        </span>
      </div>

      {/* Grid Layout */}
      <div className={`grid gap-3 ${
        attachments.length === 1 ? 'grid-cols-1' : 
        attachments.length === 2 ? 'grid-cols-2' : 
        'grid-cols-2 md:grid-cols-3'
      }`}>
        {attachments.map((attachment, i) => (
          <div key={`${attachment.s3Key}-${i}`} className="relative group">
            <CustomImage 
              s3Key={attachment.s3Key}
              alt={attachment.fileName || `Attachment ${i + 1}`}
              className="w-full h-32 object-cover border border-slate-200/50"
              onError={() => console.error('Failed to load image:', attachment.s3Key)}
            />
            
            {/* File info overlay */}
            {attachment.fileName && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <p className="text-xs text-white font-medium truncate">
                  {attachment.fileName}
                </p>
              </div>
            )}

            {/* Download button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button 
                className="bg-white/90 hover:bg-white text-slate-700 rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
                onClick={() => {
                  // Add download functionality here if needed
                  console.log('Download:', attachment.s3Key);
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Attachment count indicator for many attachments */}
      {attachments.length > 6 && (
        <div className="mt-3 text-center">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors duration-200">
            View all {attachments.length} attachments
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageAttachments;