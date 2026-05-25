import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'ceo';
  text: string;
  timestamp: string;
  file?: {
    name: string;
    url: string;
    type: string;
  };
  attachment?: {
    url: string;
    name: string;
    type: string;
  };
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ceo',
      text: 'Hello! I\'m CEO Remy. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() && !uploadedFile) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString(),
      file: uploadedFile ? {
        name: uploadedFile.name,
        url: URL.createObjectURL(uploadedFile),
        type: uploadedFile.type
      } : undefined
    };

    setMessages([...messages, newMessage]);
    setInputText('');
    setUploadedFile(null);
    setIsTyping(true);

    // Call real MFM orchestrator /ask API
    try {
      const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://mfm-corporation-telegram-bot.muhdfarihan.workers.dev';
      const DASHBOARD_SECRET = import.meta.env.VITE_DASHBOARD_SECRET || '';

      // Step 1: Upload file to R2 if present
      let file_url: string | null = null;
      let file_name: string | null = null;
      if (uploadedFile) {
        const form = new FormData();
        form.append('file', uploadedFile);
        const uploadRes = await fetch(`${WORKER_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${DASHBOARD_SECRET}` },
          body: form
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          file_url = uploadData.file_url;
          file_name = uploadData.file_name;
        }
      }

      // Step 2: Send message + optional file_url to /ask
      const res = await fetch(`${WORKER_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHBOARD_SECRET}`
        },
        body: JSON.stringify({
          text: inputText || `Please review the file I just sent.`,
          ...(file_url && { file_url, file_name })
        })
      });

      const data = await res.json();
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ceo',
        text: res.ok ? (data.response || 'No response.') : `Error: ${data.error || 'Request failed'}`,
        timestamp: new Date().toISOString(),
        attachment: data.attachment || undefined
      };
      setMessages(prev => [...prev, response]);
    } catch {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ceo',
        text: '⚠️ Could not connect to MFM system. Check network or API configuration.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, response]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      width: '400px',
      height: '600px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: '0 30px 100px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'color-mix(in oklch, var(--accent) 10%, transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'oklch(20% 0.02 255)',
            fontWeight: 600
          }}>
            CEO
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>CEO Remy</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Online</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '28px',
            height: '28px',
            padding: 0,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--fg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: '4px'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: message.sender === 'user' ? 'var(--accent)' : 'var(--bg)',
              color: message.sender === 'user' ? 'oklch(20% 0.02 255)' : 'var(--fg)',
              wordBreak: 'break-word'
            }}>
              {message.file && (
                <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>📎 {message.file.name}</div>
                  {message.file.type.startsWith('image/') && (
                    <img
                      src={message.file.url}
                      alt={message.file.name}
                      style={{ maxWidth: '100%', marginTop: '8px', borderRadius: '4px' }}
                    />
                  )}
                </div>
              )}
              {message.text}
              {message.attachment && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {message.attachment.type?.startsWith('image/') ? '🖼️' : message.attachment.type === 'text/markdown' ? '📄' : '📎'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {message.attachment.name}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.7 }}>Click to download</div>
                  </div>
                  <a
                    href={message.attachment.url}
                    download={message.attachment.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '4px 10px', background: 'var(--accent)', color: 'oklch(20% 0.02 255)', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '12px' }}>
            <span>CEO Remy is typing</span>
            <span style={{ animation: 'pulse 1s infinite' }}>●</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {uploadedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg)',
            borderRadius: 'var(--radius)',
            fontSize: '12px'
          }}>
            <span>📎 {uploadedFile.name}</span>
            <button
              onClick={() => setUploadedFile(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: 0
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--fg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
            title="Upload file"
          >
            📎
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() && !uploadedFile}
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              borderRadius: 'var(--radius)',
              border: '1px solid var(--accent)',
              background: 'var(--accent)',
              color: 'oklch(20% 0.02 255)',
              cursor: (!inputText.trim() && !uploadedFile) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              opacity: (!inputText.trim() && !uploadedFile) ? 0.5 : 1
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
