/* Conversation history shared between the floating ChatWidget and the
   VoiceAnalyzer section, so a visitor can start by voice and carry on in
   text (or vice versa) without losing the thread.

   In-memory only — nothing is persisted or sent anywhere. The reference
   implementation logged these to Supabase for an admin dashboard; that's
   deliberately left out here. */

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ChatHistoryContext = createContext(null)

let nextId = 1

export function ChatHistoryProvider({ children }) {
  const [messages, setMessages] = useState([])

  /* Returns the created message so callers can immediately reference its id
     (the widget uses it to track which message is currently being spoken). */
  const addMessage = useCallback((role, text, source = 'text') => {
    const msg = { id: nextId++, role, text, source, ts: Date.now() }
    setMessages((prev) => [...prev, msg])
    return msg
  }, [])

  const value = useMemo(() => ({ messages, addMessage }), [messages, addMessage])

  return <ChatHistoryContext.Provider value={value}>{children}</ChatHistoryContext.Provider>
}

export function useChatHistory() {
  const ctx = useContext(ChatHistoryContext)
  if (!ctx) throw new Error('useChatHistory must be used inside a ChatHistoryProvider')
  return ctx
}
