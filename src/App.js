import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';

// ─── Skill definitions ────────────────────────────────────────────────────────
const SKILLS = [
  {
    id: 'general',
    name: 'APEX General',
    icon: '⚡',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.15)',
    desc: 'All-purpose intelligent assistant',
    starters: [
      'Explain this concept to me simply',
      'Help me brainstorm ideas',
      'Review and improve my writing',
    ],
    systemPrompt: `You are APEX, a highly capable and versatile AI assistant built for professionals who demand excellence. You are sharp, articulate, and deliver answers with depth and clarity. You never pad your responses with unnecessary filler — every word earns its place. You adapt to the user's tone and needs, whether they need a quick answer or a detailed breakdown. When given ambiguous requests, you make smart assumptions and proceed, noting them briefly. You are proactive: you anticipate follow-up needs and surface useful information the user didn't know to ask for.`,
  },
  {
    id: 'copy',
    name: 'Copywriting',
    icon: '✍️',
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.15)',
    desc: 'Persuasive, high-converting copy',
    starters: [
      'Write a product description for…',
      'Create 5 headline variations for…',
      'Write a sales page for my offer',
    ],
    systemPrompt: `You are an elite direct-response copywriter with 20+ years of experience writing copy that sells. Your specialties include sales pages, VSLs, product descriptions, headlines, email sequences, ad copy, and landing pages. You understand the psychology of buying decisions deeply — pain points, desire, urgency, social proof, and objection handling. You write copy that sounds human, emotionally resonant, and benefits-focused rather than feature-focused. Use proven frameworks (AIDA, PAS, BAB, 4 Ps) where appropriate, but never let the formula be obvious. You write in the user's brand voice when given examples. Always lead with the reader's world, not the product. Cut weak words. Make every sentence pull the reader forward.`,
  },
  {
    id: 'marketing',
    name: 'Marketing Ideas',
    icon: '🚀',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    desc: 'Creative campaigns & growth strategies',
    starters: [
      'Generate 10 campaign ideas for…',
      'What channels should I focus on for…',
      'Create a 30-day content calendar for…',
    ],
    systemPrompt: `You are a world-class marketing strategist and creative director with deep expertise across digital and traditional channels. You've led campaigns for startups and Fortune 500 companies alike. Your thinking spans full-funnel strategy — brand awareness through retention — and you understand both performance marketing and brand building. When generating ideas, you think in systems: you consider customer psychology, competitive positioning, distribution channels, and measurable outcomes. You produce ideas that are specific, actionable, and differentiated — not generic advice. You understand platforms deeply: organic social, paid media, SEO, influencer, email, partnerships, events, and community. For every idea, briefly note why it works and what success looks like.`,
  },
  {
    id: 'cro',
    name: 'Page CRO',
    icon: '📈',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.15)',
    desc: 'Conversion rate optimization',
    starters: [
      'Audit my landing page copy',
      'Why might visitors be bouncing at…',
      'Suggest A/B tests for my checkout page',
    ],
    systemPrompt: `You are a senior Conversion Rate Optimization (CRO) specialist with expertise in UX, behavioral psychology, and data-driven testing. You have deep knowledge of what makes users convert — from headline clarity and value proposition strength to friction reduction and social proof placement. When analyzing a page, you systematically evaluate: the headline and above-the-fold content, value proposition clarity, call-to-action strength and placement, trust signals, page flow and logical structure, mobile experience, load speed implications, and form design. You identify the highest-leverage improvements first. You suggest specific, testable hypotheses framed as A/B tests with expected impact. You cite behavioral psychology principles (Cialdini, Kahneman, Fogg Behavior Model) where relevant. You are direct and prioritize by potential revenue impact.`,
  },
  {
    id: 'email',
    name: 'Cold Email',
    icon: '📧',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    desc: 'High-reply cold outreach sequences',
    starters: [
      'Write a cold email to a SaaS founder about…',
      'Create a 3-email follow-up sequence for…',
      'Give me 5 subject line variations that get opened',
    ],
    systemPrompt: `You are a cold email expert who has generated millions in pipeline through outbound email campaigns. You specialize in writing emails that get replies — not just opens. Your approach is rooted in extreme personalization, clear value, and low-friction CTAs. You never write emails that sound like templates. You understand that great cold emails are short (under 150 words), lead with the prospect's world (not the sender's), offer a specific and relevant insight or value, and make it easy to say yes with a single, specific ask. You know the difference between cold emails for B2B SaaS, agencies, e-commerce, and services — and you adapt accordingly. You write subject lines that feel personal, not salesy. You always think about the prospect's WIIFM (What's In It For Me). You help users build multi-touch sequences with logical follow-up logic.`,
  },
  {
    id: 'seo',
    name: 'SEO Audit',
    icon: '🔍',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    desc: 'Technical & content SEO analysis',
    starters: [
      'Audit the SEO of this page: [URL]',
      'Find keyword opportunities for…',
      'Write an SEO-optimized meta description for…',
    ],
    systemPrompt: `You are a senior SEO strategist with deep expertise in both technical SEO and content strategy. You've helped sites grow from zero to millions of organic monthly visitors. You understand Google's ranking systems deeply: E-E-A-T, Core Web Vitals, crawlability, indexability, internal linking, content depth, and search intent alignment. When auditing content or a page, you evaluate: title tag and meta description optimization, keyword targeting and semantic coverage, heading structure, content depth vs. competitor depth, internal and external linking, page speed signals, schema markup opportunities, and mobile-friendliness. You identify quick wins vs. long-term plays. You think in terms of clusters: pillar pages, supporting content, and topical authority. You give specific, prioritized recommendations with clear rationale tied to search ranking impact. You stay current with the latest algorithm updates and best practices.`,
  },
];

const SKILL_MAP = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-4-20250514';

// ─── Markdown-ish renderer (lightweight, no deps) ─────────────────────────────
function renderContent(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      // lang = line.slice(3).trim() — reserved for syntax highlighting
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{inlineFormat(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{inlineFormat(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{inlineFormat(line.slice(2))}</h1>);
    }
    // Unordered list item
    else if (/^[-*•] /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        listItems.push(<li key={i}>{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`}>{listItems}</ul>);
      continue;
    }
    // Ordered list item
    else if (/^\d+\. /.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const content = lines[i].replace(/^\d+\. /, '');
        listItems.push(<li key={i}>{inlineFormat(content)}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`}>{listItems}</ol>);
      continue;
    }
    // Horizontal rule
    else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />);
    }
    // Blank line — skip
    else if (line.trim() === '') {
      // intentionally skipped
    }
    // Normal paragraph
    else {
      elements.push(<p key={i}>{inlineFormat(line)}</p>);
    }

    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // Split by bold/italic/code markers and render spans
  const parts = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
    else if (match[3]) parts.push(<strong key={match.index}>{match[3]}</strong>);
    else if (match[4]) parts.push(<em key={match.index}>{match[4]}</em>);
    else if (match[5]) parts.push(<code key={match.index} style={{ background: 'var(--bg-input)', padding: '1px 5px', borderRadius: '4px', fontSize: '12.5px', fontFamily: 'monospace' }}>{match[5]}</code>);
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, skillColor, skillIcon, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className={`msg-avatar ${isUser ? 'user-avatar' : ''}`}
        style={isUser ? {} : { background: `rgba(${hexToRgb(skillColor)},0.15)` }}>
        {isUser ? 'You' : skillIcon}
      </div>
      <div className="msg-body">
        <div className="msg-role">{isUser ? 'You' : 'APEX'}</div>
        <div className="msg-bubble">
          {isUser ? (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
          ) : (
            <>
              {renderContent(message.content)}
              {isStreaming && <span className="typing-cursor" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Thinking indicator ───────────────────────────────────────────────────────
function ThinkingBubble({ skillIcon, skillColor }) {
  return (
    <div className="message assistant">
      <div className="msg-avatar" style={{ background: `rgba(${hexToRgb(skillColor)},0.15)` }}>
        {skillIcon}
      </div>
      <div className="msg-body">
        <div className="msg-role">APEX</div>
        <div className="msg-bubble">
          <div className="thinking-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeSkillId, setActiveSkillId] = useState('general');
  const [histories, setHistories]         = useState(() => {
    try {
      const saved = localStorage.getItem('apex_histories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return Object.fromEntries(SKILLS.map((s) => [s.id, []]));
  });
  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [isStreaming, setIsStreaming]= useState(false);
  const [error, setError]           = useState('');
  const [apiKey, setApiKey]         = useState(() => localStorage.getItem('apex_api_key') || '');
  const [showKey, setShowKey]       = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);
  const abortRef       = useRef(null);

  const skill    = SKILL_MAP[activeSkillId];
  const messages = histories[activeSkillId];

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Persist API key ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (apiKey) localStorage.setItem('apex_api_key', apiKey);
    else localStorage.removeItem('apex_api_key');
  }, [apiKey]);
  // -- Persist chat histories --
  useEffect(() => {
    try { localStorage.setItem('apex_histories', JSON.stringify(histories)); } catch (_) {}
  }, [histories]);

  // ── Auto-resize textarea ─────────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  }, [input]);

  // ── Switch skill → cancel any in-flight request ──────────────────────────────
  const switchSkill = (id) => {
    if (isLoading || isStreaming) {
      abortRef.current?.abort();
      setIsLoading(false);
      setIsStreaming(false);
    }
    setError('');
    setActiveSkillId(id);
    setInput('');
  };

  // ── Stream API call ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim()) return;
    if (!apiKey.trim()) {
      setError('Please enter your Anthropic API key in the sidebar to get started.');
      return;
    }

    const userMsg = { role: 'user', content: userText.trim() };

    setHistories((prev) => ({
      ...prev,
      [activeSkillId]: [...prev[activeSkillId], userMsg],
    }));
    setInput('');
    setError('');
    setIsLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const priorMessages = [...histories[activeSkillId], userMsg].map(({ role, content }) => ({
      role,
      content,
    }));

    try {
      const res = await fetch(API_URL, {
        method:  'POST',
        signal:  ctrl.signal,
        headers: {
          'Content-Type':            'application/json',
          'x-api-key':               apiKey.trim(),
          'anthropic-version':       '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model:      MODEL,
          max_tokens: 2048,
          system:     skill.systemPrompt,
          messages:   priorMessages,
          stream:     true,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.error?.message || `API error ${res.status}`;
        throw new Error(msg);
      }

      // Set up assistant placeholder
      const assistantMsg = { role: 'assistant', content: '' };
      setHistories((prev) => ({
        ...prev,
        [activeSkillId]: [...prev[activeSkillId], assistantMsg],
      }));
      setIsLoading(false);
      setIsStreaming(true);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (
              parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta'
            ) {
              const chunk = parsed.delta.text;
              setHistories((prev) => {
                const msgs = [...prev[activeSkillId]];
                const last = { ...msgs[msgs.length - 1] };
                last.content += chunk;
                msgs[msgs.length - 1] = last;
                return { ...prev, [activeSkillId]: msgs };
              });
            }
          } catch (_) {
            // ignore parse errors on individual chunks
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong. Please try again.');
      // Remove the user message if we errored before getting a response
      setHistories((prev) => {
        const msgs = prev[activeSkillId];
        const hasAssistant = msgs[msgs.length - 1]?.role === 'assistant';
        return {
          ...prev,
          [activeSkillId]: hasAssistant ? msgs.slice(0, -1) : msgs.slice(0, -1),
        };
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [activeSkillId, apiKey, histories, skill]);

  // ── Handle submit ────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (isLoading || isStreaming) {
      abortRef.current?.abort();
      setIsLoading(false);
      setIsStreaming(false);
      return;
    }
    if (input.trim()) sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    if (isLoading || isStreaming) {
      abortRef.current?.abort();
      setIsLoading(false);
      setIsStreaming(false);
    }
    setHistories((prev) => ({ ...prev, [activeSkillId]: [] }));
    setError('');
  };

  const apiKeyValid = apiKey.trim().startsWith('sk-ant-');

  return (
    <div className="apex-app">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-mark">A</div>
            <span className="logo-text">APEX</span>
          </div>
          <div className="logo-version">VERSION 1.2</div>
        </div>

        <div className="sidebar-label">Skill Modes</div>
        <nav className="skill-list">
          {SKILLS.map((s) => (
            <button
              key={s.id}
              className={`skill-btn ${activeSkillId === s.id ? 'active' : ''}`}
              onClick={() => switchSkill(s.id)}
            >
              <div
                className="skill-icon-wrap"
                style={{ background: activeSkillId === s.id ? s.bg : 'transparent' }}
              >
                {s.icon}
              </div>
              <span className="skill-name">{s.name}</span>
              {activeSkillId === s.id && (
                <span className="active-dot" style={{ background: s.color }} />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="api-key-section">
            <span className="api-key-label">Anthropic API Key</span>
            <div className="api-key-input-wrap">
              <input
                type={showKey ? 'text' : 'password'}
                className="api-key-input"
                placeholder="sk-ant-api03-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className="api-key-toggle"
                onClick={() => setShowKey((v) => !v)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <div className="api-status">
              <div
                className="api-status-dot"
                style={{
                  background: apiKeyValid
                    ? '#10b981'
                    : apiKey
                    ? '#f59e0b'
                    : '#4b5563',
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                {apiKeyValid
                  ? 'Key recognized'
                  : apiKey
                  ? 'Key format looks off'
                  : 'No key entered'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="main-area">
        {/* Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <div
              className="header-skill-icon"
              style={{ background: skill.bg }}
            >
              {skill.icon}
            </div>
            <div>
              <div className="header-skill-name">{skill.name}</div>
              <div className="header-skill-desc">{skill.desc}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="model-badge">
              <div className="model-dot" />
              {MODEL}
            </div>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={clearChat}>
                ✕ Clear
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{skill.icon}</div>
              <div className="empty-title">{skill.name}</div>
              <div className="empty-desc">{skill.systemPrompt.slice(0, 120)}…</div>
              <div className="starter-chips">
                {skill.starters.map((s) => (
                  <button
                    key={s}
                    className="starter-chip"
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isLastAssistant =
                  msg.role === 'assistant' && idx === messages.length - 1;
                return (
                  <MessageBubble
                    key={idx}
                    message={msg}
                    skillColor={skill.color}
                    skillIcon={skill.icon}
                    isStreaming={isLastAssistant && isStreaming}
                  />
                );
              })}
              {isLoading && !isStreaming && (
                <ThinkingBubble skillIcon={skill.icon} skillColor={skill.color} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          {error && (
            <div className="error-bar">
              <span>⚠ {error}</span>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder={`Ask ${skill.name}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={handleSubmit}
              disabled={!input.trim() && !isLoading && !isStreaming}
              title={isLoading || isStreaming ? 'Stop generation' : 'Send message'}
            >
              {isLoading || isStreaming ? '⏹' : '↑'}
            </button>
          </div>
          <div className="input-hint">
            Enter to send · Shift+Enter for new line ·{' '}
            {isLoading || isStreaming ? 'Click ⏹ to stop' : `${skill.name} mode active`}
          </div>
        </div>
      </div>
    </div>
  );
}
