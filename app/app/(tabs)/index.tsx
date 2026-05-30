import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ChatMessage = {
  id: string;
  text: string;
  role: 'user' | 'ai';
  createdAt?: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const formatMessageTime = (iso?: string) => {
  if (!iso) return '';

  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

function MessageItem({
  item,
  children,
}: {
  item: ChatMessage;
  children: React.ReactNode;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [showTime, setShowTime] = useState(false);

  const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,

onMoveShouldSetPanResponder: (_, gestureState) => {
  return (
    Math.abs(gestureState.dx) > 2 &&
    Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
  );
  
},


onMoveShouldSetPanResponderCapture: (_, gestureState) => {
  return (
    Math.abs(gestureState.dx) > 2 &&
    Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
  );
},

    onPanResponderGrant: () => {
      setShowTime(true);
    },

    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        translateX.setValue(Math.max(gestureState.dx * 1.5, -90));
      } else {
        translateX.setValue(Math.min(gestureState.dx, 0));
      }
    },

    onPanResponderRelease: () => {
  setTimeout(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start(() => {
      setShowTime(false);
    });
  }, 1500);
},

    onPanResponderTerminate: () => {
  setTimeout(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 80,
    }).start(() => {
      setShowTime(false);
    });
  }, 1500);
},




    onShouldBlockNativeResponder: () => false,
  })
).current;

  return (
    <View style={styles.swipeContainer}>
      {showTime && item.id !== 'typing' && (
        <Text
          style={[
            styles.swipeTimeText,
            item.role === 'user' ? styles.userSwipeTime : styles.aiSwipeTime,
          ]}
        >
          {formatMessageTime(item.createdAt)}
        </Text>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
}


export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Welcome to FlexAI Studio 🚀',
      role: 'ai',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
const [currentSessionId, setCurrentSessionId] = useState<string>(
  Date.now().toString()
);

const touchStartRef = useRef({
  x: 0,
  y: 0,
  time: 0,
});

const openSession = async (session: ChatSession) => {
  if (isLoading) return;

  setCurrentSessionId(session.id);
  setMessages(session.messages);
  setShowHistory(false);
};

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

const [showHistory, setShowHistory] = useState(false);

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
      {
        id: '1',
        text: 'Welcome to FlexAI Studio 🚀',
        role: 'ai',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const startNewChat = async () => {
  if (isLoading) return;

  const newSessionId = Date.now().toString();

  setCurrentSessionId(newSessionId);

  setMessages([
    {
      id: newSessionId,
      text: 'New chat started. How can I help?',
      role: 'ai',
      createdAt: new Date().toISOString(),
    },
  ]);

  setMessage('');
  setShowHistory(false);
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

  const sendMessage = async (overrideText?: string) => {
  const textToSend = overrideText || message;

  if (!textToSend.trim() || isLoading) return;

  const userText = textToSend;
    setMessage('');
    setIsLoading(true);
    stopStreamingRef.current = false;
    userPausedAutoScrollRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: userText,
        role: 'user',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'typing',
        text: 'FlexAI is thinking...',
        role: 'ai',
        createdAt: new Date().toISOString(),
      },
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
        {
          id: aiId,
          text: '',
          role: 'ai',
          createdAt: new Date().toISOString(),
        },
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
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      setIsLoading(false);
      abortControllerRef.current = null;
      userPausedAutoScrollRef.current = false;
      scrollToBottom();
    }
  };

  const copyMessage = async (id: string, text: string) => {
  await Clipboard.setStringAsync(text);

  setCopiedMessageId(id);

  setTimeout(() => {
    setCopiedMessageId(null);
  }, 1500);
};

const editMessage = (text: string) => {
  if (isLoading) return;
  setMessage(text);
};

const regenerateLastResponse = () => {
  if (isLoading) return;

  const lastAiIndex = [...messages]
    .map((msg, index) => ({ msg, index }))
    .reverse()
    .find(({ msg }) => msg.role === 'ai' && msg.id !== 'typing')?.index;

  if (lastAiIndex === undefined) return;

  const userMessageBeforeAi = [...messages]
    .slice(0, lastAiIndex)
    .reverse()
    .find((msg) => msg.role === 'user');

  if (!userMessageBeforeAi) return;

  setMessages((prev) => prev.slice(0, lastAiIndex));
  setMessage(userMessageBeforeAi.text);

  setTimeout(() => {
    sendMessage(userMessageBeforeAi.text);
  }, 100);
};

const getChatTitle = (chatMessages: ChatMessage[]) => {
  const firstUserMessage = chatMessages.find((msg) => msg.role === 'user');

  if (!firstUserMessage) return 'New Chat';

  return firstUserMessage.text.length > 32
    ? firstUserMessage.text.slice(0, 32) + '...'
    : firstUserMessage.text;
};

const saveCurrentSession = async () => {
  const realMessages = messages.filter((msg) => msg.id !== 'typing');

  if (realMessages.length <= 1) return;

  const now = new Date().toISOString();

  const sessionToSave: ChatSession = {
    id: currentSessionId,
    title: getChatTitle(realMessages),
    messages: realMessages,
    createdAt: realMessages[0]?.createdAt || now,
    updatedAt: now,
  };

  const updatedSessions = [
    sessionToSave,
    ...sessions.filter((session) => session.id !== currentSessionId),
  ];

  setSessions(updatedSessions);

  await AsyncStorage.setItem(
    'flexai_chat_sessions',
    JSON.stringify(updatedSessions)
  );
};

useEffect(() => {
  const loadSessions = async () => {
    const storedSessionsRaw = await AsyncStorage.getItem(
      'flexai_chat_sessions'
    );

    if (!storedSessionsRaw) return;

    const storedSessions: ChatSession[] = JSON.parse(storedSessionsRaw);

    setSessions(storedSessions);
  };

  loadSessions();
}, []);

useEffect(() => {
  const autoSave = async () => {
    const realMessages = messages.filter((msg) => msg.id !== 'typing');

    const hasUserMessage = realMessages.some((msg) => msg.role === 'user');

    if (!hasUserMessage) return;

    const now = new Date().toISOString();

    const sessionToSave: ChatSession = {
      id: currentSessionId,
      title: getChatTitle(realMessages),
      messages: realMessages,
      createdAt: realMessages[0]?.createdAt || now,
      updatedAt: now,
    };

    const storedSessionsRaw = await AsyncStorage.getItem(
      'flexai_chat_sessions'
    );

    const storedSessions: ChatSession[] = storedSessionsRaw
      ? JSON.parse(storedSessionsRaw)
      : [];

    const updatedSessions = [
      sessionToSave,
      ...storedSessions.filter(
        (session) => session.id !== currentSessionId
      ),
    ];

    setSessions(updatedSessions);

    await AsyncStorage.setItem(
      'flexai_chat_sessions',
      JSON.stringify(updatedSessions)
    );
  };

  autoSave();
}, [messages, currentSessionId]);

const handleChatTouchStart = (event: any) => {
  touchStartRef.current = {
    x: event.nativeEvent.pageX,
    y: event.nativeEvent.pageY,
    time: Date.now(),
  };
};

const handleChatTouchEnd = (event: any) => {
  const dx = Math.abs(event.nativeEvent.pageX - touchStartRef.current.x);
  const dy = Math.abs(event.nativeEvent.pageY - touchStartRef.current.y);
  const duration = Date.now() - touchStartRef.current.time;

  const isTap = dx < 8 && dy < 8 && duration < 300;

  if (isTap) {
    Keyboard.dismiss();
  }
};

const deleteSession = async (sessionId: string) => {
  const updatedSessions = sessions.filter(
    (session) => session.id !== sessionId
  );

  setSessions(updatedSessions);

  await AsyncStorage.setItem(
    'flexai_chat_sessions',
    JSON.stringify(updatedSessions)
  );

  if (currentSessionId === sessionId) {
    const newSessionId = Date.now().toString();

    setCurrentSessionId(newSessionId);

    setMessages([
      {
        id: newSessionId,
        text: 'New chat started. How can I help?',
        role: 'ai',
        createdAt: new Date().toISOString(),
      },
    ]);
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

          <View style={styles.headerActions}>
  <TouchableOpacity
    style={styles.headerButton}
    onPress={() => {
  Keyboard.dismiss();
  setShowHistory((prev) => !prev);
}}
  >
    <Text style={styles.headerButtonText}>History</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.headerButton} onPress={startNewChat}>
    <Text style={styles.headerButtonText}>New</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.headerButton} onPress={clearChat}>
    <Text style={styles.headerButtonText}>Clear</Text>
  </TouchableOpacity>
</View>
        </View>

{showHistory && (
  <View style={styles.historyPanel}>
    {sessions.length === 0 ? (
      <Text style={styles.emptyHistoryText}>No saved chats yet</Text>
    ) : (
      sessions.map((session) => (
  <View key={session.id} style={styles.historyItem}>
    <TouchableOpacity
      style={styles.historyInfo}
      onPress={() => openSession(session)}
    >
      <Text style={styles.historyTitle} numberOfLines={1}>
        {session.title}
      </Text>

      <Text style={styles.historyDate}>
        {new Date(session.updatedAt).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.historyDeleteButton}
      onPress={() => deleteSession(session.id)}
    >
      <Ionicons name="trash-outline" size={17} color="#8F7ACC" />
    </TouchableOpacity>
  </View>
))
    )}
  </View>
)}


        <FlatList
  ref={listRef}
  data={messages}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.messagesContent}
  keyboardShouldPersistTaps="handled"
  onTouchStart={handleChatTouchStart}
  onTouchEnd={handleChatTouchEnd}
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
  <MessageItem item={item}>
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
  <TextInput
    value={item.text}
    editable={false}
    multiline
    scrollEnabled={false}
    selectionColor="#8A5CFF"
    style={styles.messageText}
  />

</View>

{item.role === 'ai' && item.id !== 'typing' && (
      <View style={styles.aiActionRow}>
        {item.id ===
          messages.filter((msg) => msg.role === 'ai' && msg.id !== 'typing').at(-1)?.id && (
          <TouchableOpacity onPress={regenerateLastResponse}>
            <Ionicons name="refresh" size={20} color="#BFAEFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => copyMessage(item.id, item.text)}>
          <Ionicons
            name={copiedMessageId === item.id ? 'checkmark-done' : 'copy-outline'}
            size={19}
            color="#BFAEFF"
          />
        </TouchableOpacity>
      </View>
    )}

    {item.role === 'user' &&
      item.id === messages.filter((msg) => msg.role === 'user').at(-1)?.id && (
        <TouchableOpacity
          style={styles.userActionButton}
          onPress={() => editMessage(item.text)}
        >
          <Ionicons name="pencil" size={18} color="#BFAEFF" />
        </TouchableOpacity>
      )}
    </View>
  </MessageItem>
)}

        />

        <View style={styles.inputContainer}>
          <TextInput
  value={message}
  onChangeText={setMessage}
  placeholder="Ask anything..."
  placeholderTextColor="#666"
  style={styles.input}
  multiline
  scrollEnabled
  textAlignVertical="top"
/>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.stopButton]}
            onPress={isLoading ? stopResponse : () => sendMessage()}
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
  marginBottom:28,
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

  headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},

headerButton: {
  backgroundColor: '#16122B',
  borderColor: '#6F4DCC',
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 14,
},

headerButtonText: {
  color: '#C7B8FF',
  fontWeight: '700',
  fontSize: 12,
},

  messagesContent: {
    padding: 20,
    paddingBottom: 28,
  },

  messageBubble: {
  maxWidth: '82%',
  paddingVertical: 14,
  paddingHorizontal: 18,
  borderRadius: 20,
  borderWidth: 1,
  justifyContent: 'center',
},

  aiBubble: { backgroundColor: '#16122B', borderColor: '#6F4DCC' },

  userBubble: { backgroundColor: '#121212', borderColor: '#1F1F1F' },

  messageText: {
  color: 'white',
  fontSize: 16,
  lineHeight: 24,
  padding: 0,
  margin: 0,
  textAlignVertical: 'center',
},

  messageActions: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 16,
  marginTop: 12,
},

userActionButton: {
  marginTop: 5,
  marginBottom: 2,
  alignSelf: 'flex-end',
  paddingRight: 18,
},

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
  paddingTop: 14,
  paddingBottom: 14,
  borderRadius: 20,
  fontSize: 16,
  marginRight: 8,
  minHeight: 52,
  maxHeight: 120,
  textAlignVertical: 'top',
},

  button: {
  backgroundColor: '#8A5CFF',
  paddingHorizontal: 14,
  minWidth: 58,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 16,
  minHeight: 52,
  alignSelf: 'flex-end',
},

  stopButton: {
    backgroundColor: '#FF4D4D',
  },

  buttonText: { color: 'white', fontWeight: 'bold' },
  
aiActionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginTop: 6,
  marginLeft: 22,
},
  

  swipeContainer: {
    position: 'relative',
  },

  swipeTimeText: {
    position: 'absolute',
    top: '40%',
    right: 12,
    color: '#7F7399',
    fontSize: 11,
    fontWeight: '600',
  },

  userSwipeTime: {
    right: 12,
  },

  aiSwipeTime: {
    right: 12,
  },


historyPanel: {
  marginHorizontal: 20,
  marginBottom: 12,
  padding: 12,
  borderRadius: 18,
  backgroundColor: '#0F0D18',
  borderWidth: 1,
  borderColor: '#2E2255',
},

emptyHistoryText: {
  color: '#7F7399',
  fontSize: 13,
},

historyItem: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#201A33',
},

historyInfo: {
  flex: 1,
  paddingRight: 10,
},

historyDeleteButton: {
  padding: 8,
},

historyTitle: {
  color: 'white',
  fontSize: 14,
  fontWeight: '600',
},

historyDate: {
  color: '#7F7399',
  fontSize: 11,
  marginTop: 4,
  },
});

