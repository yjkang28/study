import React, { useEffect, useState } from 'react';
import { Keyboard,  View, Text, StyleSheet, FlatList, TextInput, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

//디자인확인용 테스트 데이터
const sampleMessages = [
  {
    id: '1',
    sender: 'Katherine',
    type: 'text',
    content: 'Something’s wrong with little Timmy. He’s been moping around all day—won’t eat, won’t sleep, won’t do anything. Do you think he might be sick?',
    time: '7:30 PM',
    isMe: false,
    avatar: 'https://placekitten.com/100/100',
  },
  {
    id: '2',
    sender: 'Me',
    type: 'text',
    content: 'Let me see.',
    time: '7:30 PM',
    isMe: true,
  },
  {
    id: '3',
    sender: 'Katherine',
    type: 'image',
    content: 'https://placedog.net/500',
    time: '7:31 PM',
    isMe: false,
    avatar: 'https://placekitten.com/100/100',
  },
  {
    id: '4',
    sender: 'Me',
    type: 'text',
    content: "I'll take him to vet.",
    time: '7:31 PM',
    isMe: true,
  },
];

const ChatScreen = () => {
    const navigation = useNavigation();
    const [messages, setMessages] = useState(sampleMessages);
    const [input, setInput] = useState('');
    const insets = useSafeAreaInsets();
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [inputHeight, setInputHeight] = useState(40);

    useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const renderMessage = ({ item }) => {
    if (item.isMe) {
      return (
            <View style={styles.myMessageWrapper}>
                    <View style={styles.myMessageContainer}>
                    <Text style={[styles.timeText, { marginRight: 5 }]}>{item.time}</Text>
                    <View style={styles.myBubble}>
                        <Text style={styles.myMessage}>{item.content}</Text>
                    </View>
                    </View>
            </View>
    );
    } else {
      return (
        <View style={styles.otherMessageContainer}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.otherMessageRow}>
            {item.type === 'text' ? (
              <View style={styles.otherBubble}>
                <Text style={styles.otherMessage}>{item.content}</Text>
              </View>
            ) : (
              <Image source={{ uri: item.content }} style={styles.chatImage} />
            )}
            <Text style={[styles.timeText, { marginLeft: 5 }]}>{item.time}</Text>
          </View>
        </View>
      );
    }
  };

  return (
<SafeAreaView  style={{ flex: 1 , backgroundColor: '#ffffff' }}>
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // ⬅ 헤더 높이 고려
>
     {/* 헤더 추가 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons style={styles.BackBotton} name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스터디 1</Text>
        {/* 빈 공간 (아이콘 균형 맞춤용) */}
        <View style={{ width: 24 }} /> 
      </View>
    
    
     {/*채팅 리스트*/}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, { height: Math.min(inputHeight, 120) }]}
          value={input}
          onChangeText={setInput}
          placeholder="메세지를 입력하세요."
          placeholderTextColor="#888"
          multiline={true}              // 여러 줄 입력 허용
          textAlignVertical="top"   // 입력 텍스트가 위쪽에서 시작 (Android용)
           onContentSizeChange={(e) =>
                setInputHeight(e.nativeEvent.contentSize.height)}  
        />
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#ffffff',
  },
  messageList: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001f3f',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    height: 55,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    
  },
  BackBotton: {
    
  },
  otherMessageContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  otherBubble: {
    backgroundColor: '#f0f0f0',
    padding: 11,
    borderRadius: 20,
    maxWidth: 250,
  },
  otherMessage: {
    fontSize: 14,
    color: '#000',
  },
  otherMessageRow: {
  flexDirection: 'row',
  alignItems: 'flex-end', 
},
myMessageWrapper: {
  alignItems: 'flex-end',
  marginBottom: 10,
  paddingHorizontal: 10,
},

 myMessageContainer: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  maxWidth: '85%',
},

MessageRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  maxWidth: '80%',
},

myBubble: {
  backgroundColor: '#dae7f5',
  padding: 11,
  borderRadius: 20,
  maxWidth: 250,
},


  myMessage: {
    color: 'black',
    fontSize: 14,
  },
 

  timeText: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  chatImage: {
    width: 200,
    height: 120,
    borderRadius: 10,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical:8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginRight: 8,
  },

  sendButton: {
  backgroundColor: '#007aff', // 밝고 생동감 있는 색
  borderRadius: 25,
  padding: 10,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
},
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen;