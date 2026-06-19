import AppShell from '@/components/AppShell'
import ChatClient from '@/components/ChatClient'

export default function ChatPage() {
  return (
    <AppShell active="chat" hideMobileNav>
      <ChatClient />
    </AppShell>
  )
}
