import { useEffect, useRef } from 'react'
import type { UIMessage } from 'ai'

import { AssistantMessage } from '@/components/chat/AssistantMessage'
import { animateMessageEntry } from '@/lib/animations'
import { textFromMessage, type CitationPayload } from '@/lib/citations'

type MessageBubbleProps = {
  message: UIMessage
  selectedCitationIndex: number | null
  onSelectCitation: (citation: CitationPayload) => void
  isStreaming?: boolean
}

export function MessageBubble({
  message,
  selectedCitationIndex,
  onSelectCitation,
  isStreaming,
}: MessageBubbleProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    animateMessageEntry(containerRef.current)
  }, [])

  if (message.role === 'assistant') {
    return (
      <div ref={containerRef}>
        <AssistantMessage
          message={message}
          selectedCitationIndex={selectedCitationIndex}
          onSelectCitation={onSelectCitation}
          isStreaming={isStreaming}
        />
      </div>
    )
  }

  const text = textFromMessage(message)

  return (
    <div ref={containerRef} className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-secondary-foreground shadow-2xs">
        {text}
      </div>
    </div>
  )
}
