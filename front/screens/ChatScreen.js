// screens/ChatScreen.js
// ✅ 인디고 컬러 테마 + 팝업/모달 UX + 소켓 실시간 + 읽음/핀/투표/이미지/파일 전송 통합본
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform,
  Modal, Image, Alert, ActivityIndicator, Keyboard, TouchableWithoutFeedback, Switch, BackHandler, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import api from '../services/api';
import { BACKEND_URL } from '@env';

const SOCKET_URL = BACKEND_URL;

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId, studyId, studyTitle } = route.params || {};

  // 사용자/상태
  const [userId, setUserId] = useState(null);
  const [hostId, setHostId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [input, setInput] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [notificationOn, setNotificationOn] = useState(true);
  const [noticeMessage, setNoticeMessage] = useState(null);

  const [noticeInputVisible, setNoticeInputVisible] = useState(false);
  const [noticeText, setNoticeText] = useState('');

  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [voteQuestion, setVoteQuestion] = useState('');
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [voteDeadline, setVoteDeadline] = useState(new Date(Date.now() + 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [modalImageUri, setModalImageUri] = useState(null);

  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  /** 헤더 타이틀 */
  useEffect(() => {
    if (studyTitle) navigation.setOptions({ title: studyTitle });
  }, [studyTitle]);

  /** 로그인 유저 ID 불러오기 */
  const loadUserId = useCallback(async () => {
    const stored =
      (await AsyncStorage.getItem('userId')) ||
      (await AsyncStorage.getItem('currentUserId'));
    setUserId(stored);
    return stored;
  }, []);

  /** 호스트 조회 */
  const fetchHost = useCallback(async () => {
    try {
      const res = await api.get(`/chatroom/${roomId}/host`);
      setHostId(res.data.hostId);
    } catch (err) {
      console.error('호스트 정보 불러오기 실패:', err.message);
    }
  }, [roomId]);

  const isUserHost = userId && hostId && String(userId) === String(hostId);

  /** 메시지/공지 불러오기 */
  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/chat/${roomId}/messages`);
      const data = res.data || [];
      setMessages(data);

      // 공지
      try {
        const notice = await api.get(`/chat/${roomId}/notice`);
        setNoticeMessage(notice.data);
      } catch {}

      // 스크롤 위치
      setTimeout(async () => {
        const myId = userId || (await loadUserId());
        if (!myId) return;
        const firstUnreadIndex = data.findIndex(
          (m) => !(m.readBy || []).some((id) => String(id) === String(myId))
        );
        if (firstUnreadIndex >= 0) {
          flatListRef.current?.scrollToIndex({
            index: firstUnreadIndex,
            animated: true,
            viewPosition: 0.5,
          });
        } else {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }, 200);
    } catch (err) {
      console.error('메시지 로드 실패:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId, userId, loadUserId]);

  /** 모든 메시지 읽음 처리 */
  const markAllAsRead = useCallback(async () => {
    const myId = userId || (await loadUserId());
    if (!myId) return;
    try {
      await api.patch(`/chat/${roomId}/readAll`, { userId: myId });
    } catch (err) {
      console.error('❌ 전체 읽음 실패:', err?.response?.data || err.message);
    }
  }, [roomId, userId, loadUserId]);

  /** 알림 설정 로드/저장 */
  useEffect(() => {
    (async () => {
      const myId = userId || (await loadUserId());
      if (!myId || !roomId) return;
      try {
        const res = await api.get(`/chat/${myId}/notifications`);
        const roomSetting = res.data?.[roomId];
        if (typeof roomSetting === 'boolean') setNotificationOn(roomSetting);
      } catch (err) {
        console.error('알림 설정 조회 실패:', err.message);
      }
    })();
  }, [userId, roomId, loadUserId]);

  useEffect(() => {
    (async () => {
      const myId = userId || (await loadUserId());
      if (!myId || !roomId) return;
      try {
        await api.patch(`/chat/${myId}/notifications`, { roomId, enabled: notificationOn });
      } catch (err) {
        console.error('알림 설정 저장 실패:', err.message);
      }
    })();
  }, [notificationOn]);

  /** 소켓 연결 */
  useEffect(() => {
    (async () => {
      const id = await loadUserId();
      if (!id) return;

      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
      socketRef.current.emit('joinRoom', roomId);

      socketRef.current.on('receiveMessage', (msg) => {
        setMessages((prev) => [...prev, msg]);
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      // readCount 갱신
      socketRef.current.on('updateReadCount', ({ messageId, readCount }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, readCount } : m))
        );
      });

      // 고정 갱신
      socketRef.current.on('pinnedUpdated', ({ pinned }) => {
        setMessages((prev) =>
          prev.map((m) => (m._id === pinned ? { ...m, __pinned: true } : { ...m, __pinned: false }))
        );
      });
    })();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, loadUserId]);

  /** 포커스될 때 마다 새로고침 + 읽음 + 호스트 */
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        await fetchMessages();
        await fetchHost();
        const id = userId || (await loadUserId());
        if (active && id) {
          await markAllAsRead();
        }
      })();
      return () => { active = false; };
    }, [fetchMessages, fetchHost, roomId, userId])
  );

  /** 키보드/뒤로 가기 핸들링 */
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setPopupVisible(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    });
    const backAction = () => {
      if (popupVisible) { setPopupVisible(false); return true; }
      if (noticeInputVisible) { setNoticeInputVisible(false); return true; }
      if (voteModalVisible) { setVoteModalVisible(false); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => { showSub.remove(); backHandler.remove(); };
  }, [popupVisible, noticeInputVisible, voteModalVisible]);

  /** 로딩 화면 */
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8, color: '#555' }}>메시지를 불러오는 중…</Text>
      </View>
    );
  }

  /** ===== 전송 액션 ===== */
  const sendTextMessage = async () => {
    if (!input.trim()) return;
    try {
      await api.post(`/chat/${roomId}/messages`, {
        senderId: userId,
        type: 'text',
        content: input.trim(),
      });
      setInput('');
    } catch (err) {
      console.error('텍스트 메시지 전송 실패:', err.message);
    }
  };

  const pickAndSendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 10,
      });
      if (result.canceled) return;

      const files = result.assets || [];
      const formData = new FormData();
      formData.append('senderId', userId);
      files.forEach((file) => {
        formData.append('files', {
          uri: file.uri,
          type: 'image/jpeg',
          name: file.fileName || `photo_${Date.now()}.jpg`,
        });
      });

      await api.post(`/chat/${roomId}/messages/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      console.error('이미지 업로드 실패:', err.message);
      Alert.alert('오류', '이미지를 전송하지 못했습니다.');
    }
  };

  const sendFileMessage = async () => {
    try {
      const result = await ImagePicker.launchDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];

      const formData = new FormData();
      formData.append('senderId', userId);
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name || `file_${Date.now()}`,
      });

      await api.post(`/chat/${roomId}/messages/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      console.error('파일 업로드 실패:', err.message);
      Alert.alert('오류', '파일을 전송하지 못했습니다.');
    }
  };

  const sendNotice = async () => {
    if (!isUserHost) {
      Alert.alert('안내', '스터디장만 공지를 작성할 수 있어요.');
      setNoticeInputVisible(false);
      return;
    }
    if (!noticeText.trim()) {
      Alert.alert('안내', '공지 내용을 입력해주세요.');
      return;
    }
    try {
      await api.post(`/chat/${roomId}/notice`, {
        roomId,
        senderId: userId,
        content: noticeText.trim(),
      });
      setNoticeInputVisible(false);
      setNoticeText('');
      fetchMessages();
    } catch (err) {
      console.error('공지 작성 실패:', err.message);
      Alert.alert('오류', '공지 작성에 실패했습니다.');
    }
  };

  const sendPollMessage = async () => {
    if (!voteQuestion.trim()) {
      Alert.alert('안내', '투표 질문을 입력하세요.');
      return;
    }
    const options = voteOptions.map((v) => v.trim()).filter(Boolean);
    if (options.length < 2) {
      Alert.alert('안내', '투표 옵션은 최소 2개가 필요합니다.');
      return;
    }
    try {
      const pollData = {
        question: voteQuestion.trim(),
        options: options.map((opt) => ({ text: opt, votes: [] })),
        deadline: voteDeadline,
      };
      await api.post(`/chat/${roomId}/messages`, { senderId: userId, type: 'poll', poll: pollData });
      setVoteModalVisible(false);
      setVoteQuestion('');
      setVoteOptions(['', '']);
      setVoteDeadline(new Date(Date.now() + 86400000));
      fetchMessages();
    } catch (err) {
      console.error('투표 전송 실패:', err.message);
      Alert.alert('오류', '투표를 전송하지 못했습니다.');
    }
  };

  const pinMessage = async (messageId) => {
    try {
      await api.post(`/chat/${roomId}/messages/${messageId}/pin`);
      socketRef.current?.emit('pinnedUpdated', { pinned: messageId });
      Alert.alert('공지', '메시지가 고정되었습니다.');
    } catch (err) {
      console.error('메시지 고정 실패:', err.message);
      Alert.alert('오류', '메시지를 고정하지 못했습니다.');
    }
  };

  const votePoll = async (messageId, optionIndex) => {
    try {
      await api.post(`/chat/${roomId}/poll/${messageId}/vote`, { userId, optionIndex });
      fetchMessages();
    } catch (err) {
      console.error('투표 실패:', err.message);
      Alert.alert('오류', '투표에 실패했습니다.');
    }
  };

  /** ===== 메시지 렌더링 (인디고 테마) ===== */
  const renderMessage = ({ item }) => {
    const isMine = item.sender?._id === userId || item.sender === userId;
    const bubbleStyle = isMine ? styles.myBubble : styles.otherBubble;
    const textStyle = isMine ? styles.myText : styles.otherText;
    const isPinned = item.__pinned || false;

    if (item.type === 'image') {
      const uri = item.content?.startsWith('http')
        ? item.content
        : `${BACKEND_URL}/${item.content}`;
      return (
        <View style={[styles.messageRow, isMine && { justifyContent: 'flex-end' }]}>
          <View style={[styles.bubble, bubbleStyle]}>
            {isPinned && (
              <View style={styles.pinnedTag}>
                <Ionicons name="pin" size={14} color="#ff9500" />
                <Text style={{ fontSize: 12, color: '#ff9500', marginLeft: 4 }}>공지</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setModalImageUri(uri)}>
              <Image source={{ uri }} style={{ width: 200, height: 200, borderRadius: 12 }} />
            </TouchableOpacity>
            {isUserHost && (
              <TouchableOpacity onPress={() => pinMessage(item._id)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: isMine ? '#fff' : '#4C63D2' }}>📌 고정</Text>
              </TouchableOpacity>
            )}
          </View>
          {!isMine && (
            <Text style={[styles.senderName, { alignSelf: 'flex-start', marginLeft: 4 }]}>
              {item.sender?.username || '익명'}
            </Text>
          )}
        </View>
      );
    }

    if (item.type === 'file') {
      const fileName = item.content?.split('/').pop() || '파일';
      return (
        <View style={[styles.messageRow, isMine && { justifyContent: 'flex-end' }]}>
          <View style={[styles.bubble, bubbleStyle]}>
            {isPinned && (
              <View style={styles.pinnedTag}>
                <Ionicons name="pin" size={14} color="#ff9500" />
                <Text style={{ fontSize: 12, color: '#ff9500', marginLeft: 4 }}>공지</Text>
              </View>
            )}
            <TouchableOpacity style={styles.fileBox} onPress={() => Alert.alert('파일', '다운로드 기능을 구현하세요.')}>
              <Ionicons name="document" size={18} color="#4C63D2" />
              <Text style={styles.fileText}>{fileName}</Text>
            </TouchableOpacity>
            {isUserHost && (
              <TouchableOpacity onPress={() => pinMessage(item._id)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: isMine ? '#fff' : '#4C63D2' }}>📌 고정</Text>
              </TouchableOpacity>
            )}
          </View>
          {!isMine && (
            <Text style={[styles.senderName, { alignSelf: 'flex-start', marginLeft: 4 }]}>
              {item.sender?.username || '익명'}
            </Text>
          )}
        </View>
      );
    }

    if (item.type === 'poll') {
      const deadlinePassed = item.poll?.deadline && new Date(item.poll.deadline) < new Date();
      return (
        <View style={[styles.messageRow, isMine && { justifyContent: 'flex-end' }]}>
          <View style={[
            styles.pollBubble,
            { backgroundColor: isMine ? '#4C63D2' : '#E8EAFF' }
          ]}>
            {isPinned && (
              <View style={[styles.pinnedTag, { marginBottom: 6 }]}>
                <Ionicons name="pin" size={14} color="#ff9500" />
                <Text style={{ fontSize: 12, color: '#ff9500', marginLeft: 4 }}>공지</Text>
              </View>
            )}
            <Text style={[styles.pollQuestion, { color: isMine ? '#fff' : '#4C63D2' }]}>
              📊 {item.poll?.question || item.content}
            </Text>
            {item.poll?.options?.map((opt, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.pollOption,
                  {
                    backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : '#fff',
                    borderLeftColor: '#6366F1',
                  },
                ]}
                disabled={deadlinePassed}
                onPress={() => votePoll(item._id, idx)}
              >
                <Text style={{ color: isMine ? '#fff' : '#333', fontWeight: '500' }}>
                  {opt.text} {opt.votes ? `(${opt.votes.length}표)` : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={{ marginTop: 6, fontSize: 12, color: isMine ? 'rgba(255,255,255,0.8)' : '#666' }}>
              마감: {new Date(item.poll?.deadline).toLocaleString()}
            </Text>
            {isUserHost && (
              <TouchableOpacity onPress={() => pinMessage(item._id)} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: isMine ? '#fff' : '#4C63D2' }}>📌 고정</Text>
              </TouchableOpacity>
            )}
          </View>
          {!isMine && (
            <Text style={[styles.senderName, { alignSelf: 'flex-start', marginLeft: 4 }]}>
              {item.sender?.username || '익명'}
            </Text>
          )}
        </View>
      );
    }

    // 기본 텍스트
    return (
      <View style={[styles.messageRow, isMine && { justifyContent: 'flex-end' }]}>
        <View style={[styles.bubble, bubbleStyle]}>
          {isPinned && (
            <View style={styles.pinnedTag}>
              <Ionicons name="pin" size={14} color="#ff9500" />
              <Text style={{ fontSize: 12, color: '#ff9500', marginLeft: 4 }}>공지</Text>
            </View>
          )}
          <Text style={textStyle}>{item.content}</Text>
          {isUserHost && (
            <TouchableOpacity onPress={() => pinMessage(item._id)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: isMine ? '#fff' : '#4C63D2' }}>📌 고정</Text>
            </TouchableOpacity>
          )}
        </View>
        {!isMine && (
          <Text style={[styles.senderName, { alignSelf: 'flex-start', marginLeft: 4 }]}>
            {item.sender?.username || '익명'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setPopupVisible(false); }}>
        <View style={{ flex: 1 }}>
          {/* 공지 바 */}
          {noticeMessage?.content ? (
            <View style={styles.noticeBar}>
              <Ionicons name="notifications" size={18} color="#4C63D2" style={{ marginRight: 8 }} />
              <Text style={{ fontWeight: '600', color: '#4C63D2', flex: 1 }}>{noticeMessage.content}</Text>
            </View>
          ) : null}

          {/* 메시지 리스트 */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 90 }}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onScrollBeginDrag={() => setPopupVisible(false)}
          />

          {/* 입력 행 */}
          <View style={styles.inputBox}>
            <TouchableOpacity onPress={() => setPopupVisible((v) => !v)}>
              <Ionicons name="add-circle" size={28} color="#4C63D2" />
            </TouchableOpacity>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="메시지를 입력하세요"
              placeholderTextColor="#AAA"
              style={styles.input}
              onFocus={() => setPopupVisible(false)}
            />
            <TouchableOpacity onPress={sendTextMessage}>
              <Ionicons name="send" size={26} color="#4C63D2" />
            </TouchableOpacity>
          </View>

          {/* + 팝업 */}
          {popupVisible && (
            <>
              <Pressable style={styles.backdrop} onPress={() => setPopupVisible(false)} />
              <View style={styles.popupBox}>
                <View style={styles.popupItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="notifications" size={18} color="#4C63D2" style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#333' }}>알림</Text>
                  </View>
                  <Switch
                    value={notificationOn}
                    onValueChange={setNotificationOn}
                    trackColor={{ false: '#ccc', true: '#B5BFFF' }}
                    thumbColor={notificationOn ? '#4C63D2' : '#f4f3f4'}
                  />
                </View>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => { setPopupVisible(false); setNoticeInputVisible(true); }} style={styles.popupMenuItem}>
                  <Ionicons name="megaphone" size={18} color="#4C63D2" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#333' }}>공지 작성</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => { setPopupVisible(false); setVoteModalVisible(true); }} style={styles.popupMenuItem}>
                  <Ionicons name="bar-chart" size={18} color="#4C63D2" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#333' }}>투표 작성</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => { setPopupVisible(false); pickAndSendImage(); }} style={styles.popupMenuItem}>
                  <Ionicons name="image" size={18} color="#4C63D2" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#333' }}>이미지 보내기</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity onPress={() => { setPopupVisible(false); sendFileMessage(); }} style={styles.popupMenuItem}>
                  <Ionicons name="document-attach" size={18} color="#4C63D2" style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#333' }}>파일 보내기</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* 공지 모달 */}
          <Modal visible={noticeInputVisible} transparent animationType="slide" onRequestClose={() => setNoticeInputVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <TouchableWithoutFeedback onPress={() => setNoticeInputVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <View style={styles.noticeModalBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="megaphone" size={24} color="#4C63D2" style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 18, fontWeight: '700', color: '#4C63D2' }}>공지 작성</Text>
                        </View>
                        <TouchableOpacity onPress={() => setNoticeInputVisible(false)}>
                          <Ionicons name="close" size={24} color="#999" />
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        value={noticeText}
                        onChangeText={setNoticeText}
                        placeholder="공지사항 내용을 입력하세요"
                        placeholderTextColor="#AAA"
                        multiline
                        style={styles.noticeInput}
                      />
                      <TouchableOpacity onPress={sendNotice} style={styles.sendNoticeBtn}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>공지 발송</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>

          {/* 투표 모달 */}
          <Modal visible={voteModalVisible} transparent animationType="slide" onRequestClose={() => setVoteModalVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <TouchableWithoutFeedback onPress={() => setVoteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <View style={styles.voteModalBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                        <Ionicons name="bar-chart" size={24} color="#4C63D2" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#4C63D2' }}>투표 생성</Text>
                      </View>
                      <TextInput
                        value={voteQuestion}
                        onChangeText={setVoteQuestion}
                        placeholder="투표 질문을 입력하세요"
                        placeholderTextColor="#AAA"
                        style={styles.modalInput}
                      />
                      {voteOptions.map((opt, idx) => (
                        <TextInput
                          key={idx}
                          value={opt}
                          onChangeText={(v) => {
                            const newOpts = [...voteOptions];
                            newOpts[idx] = v;
                            setVoteOptions(newOpts);
                          }}
                          placeholder={`옵션 ${idx + 1}`}
                          placeholderTextColor="#AAA"
                          style={styles.modalInput}
                        />
                      ))}
                      {voteOptions.length < 8 && (
                        <TouchableOpacity onPress={() => setVoteOptions([...voteOptions, ''])} style={styles.addOptionBtn}>
                          <Ionicons name="add" size={20} color="#4C63D2" />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#4C63D2', marginLeft: 4 }}>옵션 추가</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                        <Ionicons name="calendar" size={18} color="#4C63D2" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 14, color: '#4C63D2', fontWeight: '500' }}>
                          마감일: {voteDeadline.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={voteDeadline}
                          mode="date"
                          display="default"
                          onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setVoteDeadline(selectedDate);
                          }}
                        />
                      )}
                      <TouchableOpacity onPress={sendPollMessage} style={styles.sendVoteBtn}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>투표 생성</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>

          {/* 이미지 전체보기 모달 */}
          <Modal visible={!!modalImageUri} transparent animationType="fade" onRequestClose={() => setModalImageUri(null)}>
            <Pressable style={styles.fullscreenOverlay} onPress={() => setModalImageUri(null)}>
              {modalImageUri && <Image source={{ uri: modalImageUri }} style={styles.fullImage} resizeMode="contain" />}
            </Pressable>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // 공지 바
  noticeBar: {
    backgroundColor: '#E8EAFF',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#D5D9FF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  // 리스트/버블
  messageRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', paddingHorizontal: 12 },
  bubble: {
    maxWidth: '80%', borderRadius: 12, padding: 12, marginVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  pollBubble: {
    maxWidth: '85%', borderRadius: 12, padding: 14, marginVertical: 8,
    shadowColor: '#4C63D2', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  myBubble: { backgroundColor: '#4C63D2', alignSelf: 'flex-end' },
  otherBubble: { backgroundColor: '#F0F1FF', alignSelf: 'flex-start' },
  myText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  otherText: { color: '#333', fontSize: 15, lineHeight: 20 },
  senderName: { fontSize: 11, color: '#555', marginLeft: 6, marginBottom: 2 },

  pinnedTag: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  fileBox: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: '#fff', padding: 6, borderRadius: 8 },
  fileText: { marginLeft: 6, color: '#4C63D2', fontSize: 14, fontWeight: '600' },

  pollQuestion: { fontWeight: '700', fontSize: 15, marginBottom: 10 },
  pollOption: { paddingVertical: 10, paddingHorizontal: 12, marginVertical: 4, borderRadius: 8, borderLeftWidth: 3 },
  pollOptionText: { fontSize: 14, color: '#333' },
  pollDeadline: { fontSize: 12, color: '#888', marginTop: 4 },

  // 입력행 + 팝업
  inputBox: {
    flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderColor: '#E5E7EB',
    padding: 12, backgroundColor: '#fff',
  },
  input: {
    flex: 1, marginLeft: 12, marginRight: 12, borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: '#F5F7FA', fontSize: 15, color: '#333',
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  popupBox: {
    position: 'absolute', bottom: 70, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, elevation: 8,
  },
  popupItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  popupMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderColor: '#F0F0F0', marginVertical: 6 },

  // 모달 공통
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },

  // 투표 모달
  voteModalBox: { backgroundColor: 'white', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  modalInput: {
    borderBottomWidth: 2, borderColor: '#E8EAFF', marginBottom: 16, paddingVertical: 12, paddingHorizontal: 0, fontSize: 15, color: '#333',
  },
  addOptionBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginVertical: 12,
    backgroundColor: '#F5F7FA', borderRadius: 10, borderWidth: 2, borderColor: '#E8EAFF', borderStyle: 'dashed',
  },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, marginVertical: 16,
    backgroundColor: '#F5F7FA', borderRadius: 10, borderWidth: 1, borderColor: '#E8EAFF',
  },
  sendVoteBtn: {
    backgroundColor: '#4C63D2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20,
    shadowColor: '#4C63D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, elevation: 5,
  },

  // 공지 모달
  noticeModalBox: { backgroundColor: 'white', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  noticeInput: {
    borderWidth: 1.5, borderColor: '#E8EAFF', borderRadius: 12, padding: 16, fontSize: 15, color: '#333',
    minHeight: 120, textAlignVertical: 'top', marginBottom: 16,
  },
  sendNoticeBtn: {
    backgroundColor: '#4C63D2', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    shadowColor: '#4C63D2', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, elevation: 5,
  },

  // 풀스크린 이미지
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '92%', height: '92%' },
});