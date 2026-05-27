import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { API_BASE_URL } from '@/config/api';

type ChatMessage = {
  id: string;
  text: string;
  role: 'user' | 'ai';
};

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Welcome to FlexAI Studio 🚀', role: 'ai' },
  ]);

  const listRef = useRef<FlatList<ChatMessage>>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userText = message;
    setMessage('');

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: userText, role: 'user' },
      { id: 'typing', text: 'AI is thinking...', role: 'ai' },
    ]);

    scrollToBottom();
const clearChat = () => {
  setMessages([
    { id: '1', text: 'Welcome to FlexAI Studio 🚀', role: 'ai' },
  ]);
};
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
        }),
      });

      const data = await response.json();

      const aiText =
        data?.choices?.[0]?.message?.content ||
        data?.error?.message ||
        JSON.stringify(data);

      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== 'typing'),
        { id: Date.now().toString() + '-ai', text: aiText, role: 'ai' },
      ]);

      scrollToBottom();
    } catch (error) {
      setMessages((prev) => [
        ...prev.filter((msg) => msg.id !== 'typing'),
        { id: Date.now().toString() + '-error', text: 'Error connecting to backend.', role: 'ai' },
      ]);

      scrollToBottom();
    }
  };
const clearChat = () => {
  setMessages([
    { id: '1', text: 'Welcome to FlexAI Studio 🚀', role: 'ai' },
  ]);
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
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.role === 'ai' ? styles.aiBubble : styles.userBubble]}>
              <Text style={styles.messageText}>{item.text}</Text>
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

          <TouchableOpacity style={styles.button} onPress={sendMessage}>
            <Text style={styles.buttonText}>Send</Text>
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

header: {
  color: 'white',
  fontSize: 28,
  fontWeight: 'bold',
},

clearButton: {
  backgroundColor: '#16122B',
  borderColor: '#8A5CFF',
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
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
  },

  aiBubble: { backgroundColor: '#16122B', borderColor: '#8A5CFF' },

  userBubble: { backgroundColor: '#121212', borderColor: '#1F1F1F' },

  messageText: { color: 'white', fontSize: 16, lineHeight: 23 },

  inputContainer: {
    flexDirection: 'row',
    padding: 15,
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
    backgroundColor: '#8A5CFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 16,
  },

  buttonText: { color: 'white', fontWeight: 'bold' },
});