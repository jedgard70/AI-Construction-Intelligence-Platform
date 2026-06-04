# Apex AI Response Actions & Attachments Analysis

## Implementation Checklist

### Response Actions
- [x] **Copy**: Copy response text to clipboard
- [x] **Speak**: Text-to-speech using Web Speech Synthesis API (pt-BR)
- [x] **Share**: Share via Web Share API or fallback to copy
- [x] **More Menu**: Additional formatting options (copy with timestamp, bullet-point format)

### Attachment Analysis
- [x] **File Support**: PNG, JPEG, WebP, PDF
- [x] **Size Limits**: Images (5MB), PDF (10MB)
- [x] **Image Analysis**: Multimodal vision using Claude Sonnet 4.6
- [x] **PDF Extraction**: Text extraction via pdf-parse
- [x] **No Permanent Storage**: Temp files deleted after processing
- [x] **No Content Logging**: Analysis happens server-side, no file content logged

### Frontend (ApexCopilot.tsx)
- [x] Response action buttons on assistant messages
  - Copy (📋)
  - Speak (🔊)
  - Share (🔗)
  - More menu (⋮)
- [x] File input with validation
- [x] Attachment preview with removal option
- [x] Attachment analysis before sending (async)
- [x] Error handling with user feedback

### Backend APIs
- [x] `/api/chat/analyze-attachment` - Handles image/PDF analysis
  - Image: Vision analysis with Claude
  - PDF: Text extraction
  - Requires auth token (Bearer)
  - Returns: `{ type, analysis, filename }`

### Tech Stack
- Frontend: React, Web Speech Synthesis, Web Share API
- Backend: Node.js, Next.js
- Processing: Claude Sonnet 4.6 (multimodal), pdf-parse library

## Features

### Response Actions Flow
1. User gets assistant response
2. Action buttons appear below message
3. Copy: Uses `navigator.clipboard.writeText()`
4. Speak: Uses `window.speechSynthesis.speak()` with pt-BR locale
5. Share: Uses `navigator.share()` with fallback to copy
6. More Menu: Additional options with formatting

### Attachment Analysis Flow
1. User selects file (image or PDF)
2. File validated (type, size)
3. File stored in state with File object
4. User sends message
5. Before sending to chat API:
   - Attachment sent to `/api/chat/analyze-attachment`
   - Analysis received (image description or PDF text summary)
   - Analysis appended to message
6. Full message (text + analysis) sent to chat
7. Response received and displayed
8. Temp file cleaned up

## Testing Checklist

### Response Actions
- [ ] Copy works (test with various text lengths)
- [ ] Speak works (test with pt-BR audio)
- [ ] Speak stops when starting new speak
- [ ] Share works (mobile: native share dialog, desktop: copy fallback)
- [ ] More menu opens/closes correctly
- [ ] Timestamp copy includes current time
- [ ] Bullet format copy reformats correctly

### Attachments
- [ ] PNG image upload works
- [ ] JPEG image upload works
- [ ] WebP image upload works
- [ ] PDF upload works
- [ ] Image size validation (reject >5MB)
- [ ] PDF size validation (reject >10MB)
- [ ] Invalid file type rejected with message
- [ ] Preview shows filename and size
- [ ] Removal button (✕) deletes attachment
- [ ] Multiple attachments supported
- [ ] Image analysis returns description
- [ ] PDF analysis returns text extract
- [ ] Analysis appended to message
- [ ] Auth token sent with analysis request

### Mobile & Responsive
- [ ] Panel resizes on mobile
- [ ] Action buttons visible on mobile
- [ ] File input works on mobile
- [ ] Share button opens native mobile share
- [ ] Speech works on mobile
- [ ] Fullscreen mode works on mobile

### Build & Deployment
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors/warnings
- [ ] Build completes successfully
- [ ] API routes load correctly
- [ ] Formidable (multipart) handling works

## Security Notes

### Attachment Handling
- Files validated by type and size before upload
- Temp files not persisted (formidable auto-cleanup)
- No file content stored in logs
- Auth token required for analysis endpoint
- Base64 encoding used for image transmission
- PDF content extracted server-side, not exposed to client

### Response Actions
- No external URLs called
- Clipboard/Share API require user gesture
- Speech synthesis is client-side (no upload)
- All operations are user-initiated

## Known Limitations

1. **PDF Analysis**: Relies on pdf-parse library; some PDFs with special encoding may not extract text properly
2. **Image Analysis**: Limited to vision model capabilities
3. **Concurrent Uploads**: UI shows attachment list but processes one at a time
4. **File Size**: Large files may take time to analyze
5. **Browser Support**: 
   - Web Speech Synthesis: Chrome, Edge, Safari (not Firefox on all platforms)
   - Web Share API: Modern browsers (fallback to copy)

## Future Enhancements

1. Multiple file types support (.xlsx, .docx, .pptx, .txt)
2. Drag-drop file upload
3. Image preview thumbnail before analysis
4. Cancel ongoing analysis
5. Download analyzed content
6. Archive old conversations with attachments
7. Edit attachment metadata
8. Batch analysis for multiple files
