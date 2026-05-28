import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { API_BASE_URL } from '@/config/api';

type ChatMessage = {
  id: string;
  text: string;
  role: 'user' | 'ai';
};

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Welcome to FlexAI Studio 🚀', role: 'ai' },
  ]);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopStreamingRef = useRef(false);
  const userPausedAutoScrollRef = useRef(false);
  const userIsDraggingRef = useRef(false);

  const scrollToBottom = (animated = true, delay = 150) => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated });
    }, delay);
  };

  const getDistanceFromBottom = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    return contentSize.height - (contentOffset.y + layoutMeasurement.height);
  };

  const handleMessagesScroll = (event: any) => {
    // Do not re-enable auto-scroll while the user is actively dragging.
    // This prevents the list from fighting the user's finger.
    if (userIsDraggingRef.current) return;

    const distanceFromBottom = getDistanceFromBottom(event);

    // If the user is already near the bottom, auto-scroll can stay active.
    if (distanceFromBottom < 35) {
      userPausedAutoScrollRef.current = false;
    }
  };

  const handleScrollBeginDrag = () => {
    userIsDraggingRef.current = true;

    // While FlexAI is typing, any manual drag means: pause auto-scroll.
    if (isLoading) {
      userPausedAutoScrollRef.current = true;
    }
  };

  const handleScrollEndDrag = (event: any) => {
    userIsDraggingRef.current = false;

    // Auto-scroll resumes only if the user manually returns near the bottom.
    if (getDistanceFromBottom(event) < 35) {
      userPausedAutoScrollRef.current = false;
    }
  };

  const shouldAutoScroll = () => !userPausedAutoScrollRef.current;

  const clearChat = () => {
    if (isLoading) return;

    setMessages([
      { id: '1', text: 'Welcome to FlexAI Studio 🚀', role: 'ai' },
    ]);
  };

  const stopResponse = () => {
    stopStreamingRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }

    setMessages((prev) => prev.filter((msg) => msg.id !== 'typing'));
    setIsLoading(false);
    scrollToBottom();
  };

  const typeAiResponse = (aiId: string, fullText: string, signal: AbortSignal) => {
    return new Promise<void>((resolve) => {
      let index = 0;
      const chunkSize = fullText.length > 900 ? 2 : 1;
const speed = fullText.length > 900 ? 40 : 50;

      const step = () => {
        if (signal.aborted || stopStreamingRef.current) {
          resolve();
          return;
        }

        index = Math.min(index + chunkSize, fullText.length);
        const visibleText = fullText.slice(0, index);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiId ? { ...msg, text: visibleText } : msg
          )
        );

        if (shouldAutoScroll()) {
          scrollToBottom(false, 0);
        }

        if (index < fullText.length) {
          streamTimeoutRef.current = setTimeout(step, speed);
        } else {
          streamTimeoutRef.current = null;
          resolve();
        }
      };

      step();
    });
  };

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userText = message;
    setMessage('');
    setIsLoading(true);
    stopStreamingRef.current = false;
    userPausedAutoScrollRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: userText, role: 'user' },
      { id: 'typing', text: 'FlexAI is thinking...', role: 'ai' },
    ]);

    scrollToBottom();

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: userText,
          history: messages
            .filter((msg) => msg.id !== 'typing')
            .slice(-20)
            .map((msg) => ({
              role: msg.role === 'ai' ? 'assistant' : 'user',
              content: msg.text,
            })),
        }),
      });

      const data = await response.json();

      const aiText =
        data?.choices?.[0]?.message?.content ||
        data?.error?.message ||
        data?.error ||
        'Something went wrong. Please try again.';

      const aiId = Date.now().toString() + '-ai';

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== 'typing'),
        { id: aiId, text: '', role: 'ai' },
      ]);

      await typeAiResponse(aiId, aiText, controller.signal);

      setIsLoading(false);
      abortControllerRef.current = null;
      userPausedAutoScrollRef.current = false;
      scrollToBottom();
    } catch (error: any) {
      setMessages((prev) => prev.filter((msg) => msg.id !== 'typing'));

      if (error?.name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + '-error',
            text: 'Connection issue. Please check your internet and try again.',
            role: 'ai',
          },
        ]);
      }

      setIsLoading(false);
      abortControllerRef.current = null;
      userPausedAutoScrollRef.current = false;
      scrollToBottom();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>FlexAI Chat</Text>

          <TouchableOpacity style={styles.clearButton} onPress={clearChat}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onScroll={handleMessagesScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleScrollEndDrag}
          scrollEventThrottle={16}
          onContentSizeChange={() => {
            if (shouldAutoScroll()) {
              scrollToBottom(false, 0);
            }
          }}
          onLayout={() => {
            if (!isLoading && shouldAutoScroll()) {
              scrollToBottom();
            }
          }}
          renderItem={({ item }) => (
  <View
    style={[
      styles.messageRow,
      item.role === 'user' ? styles.userRow : styles.aiRow,
    ]}
  >
    <View
      style={[
        styles.messageBubble,
        item.role === 'ai' ? styles.aiBubble : styles.userBubble,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  </View>
)}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Ask anything..."
            placeholderTextColor="#666"
            style={styles.input}
            multiline={true}
            textAlignVertical="center"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.stopButton]}
            onPress={isLoading ? stopResponse : sendMessage}
          >
            <Text style={styles.buttonText}>{isLoading ? '■' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },

  headerRow: {
    marginTop: 70,
    marginHorizontal: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  messageRow: {
  width: '100%',
  marginBottom: 12,
  paddingHorizontal: 0,
},

aiRow: {
  alignItems: 'flex-start',
  paddingRight: 45,
},

userRow: {
  alignItems: 'flex-end',
  paddingLeft: 45,
},

  header: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  clearButton: {
    backgroundColor: '#16122B',
    borderColor: '#6F4DCC',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  clearButtonText: {
    color: '#C7B8FF',
    fontWeight: '700',
    fontSize: 13,
  },

  messagesContent: {
    padding: 20,
    paddingBottom: 24,
  },

  messageBubble: {
  maxWidth: '82%',
  paddingVertical: 15,
  paddingHorizontal: 18,
  borderRadius: 20,
  borderWidth: 1,
},

  aiBubble: { backgroundColor: '#16122B', borderColor: '#6F4DCC' },

  userBubble: { backgroundColor: '#121212', borderColor: '#1F1F1F' },

  messageText: { color: 'white', fontSize: 16, lineHeight: 25, textAlign: 'left', },

  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: '#1A1A1A',
    backgroundColor: '#0B0B0B',
  },

  input: {
    flex: 1,
    backgroundColor: '#151515',
    color: 'white',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    fontSize: 16,
    marginRight: 6,
  },

  button: {
    backgroundColor: '#7B5CFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    minWidth: 58,
  },

  stopButton: {
    backgroundColor: '#FF4D4D',
  },

  buttonText: { color: 'white', fontWeight: 'bold' },
});
