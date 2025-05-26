import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';


const ChatListScreen = () => {
  
  const navigation = useNavigation();
  const [isSwipeMode, setIsSwipeMode] = useState(true); 
  const [chatData, setChatData] = useState([
  {
    id: '1',
    name: '스터디 1',
    time: '12:30pm',
    participants: 5,
    avatar: 'https://placekitten.com/200/200',
    isMuted: false
  },
  {
    id: '2',
    name: '스터디 2',
    time: '12:30pm',
    participants: 5,
    avatar: 'https://placekitten.com/201/201',
    isMuted: false 
  },
  {
    id: '3',
    name: '스터디 3',
    time: '12:30pm',
    participants: 5,
    avatar: 'https://placekitten.com/202/202',
    isMuted: false 
  },
  {
    id: '4',
    name: '스터디 4',
    time: '12:30pm',
    participants: 5,
    avatar: 'https://placekitten.com/203/203',
    isMuted: false 
  },
  {
    id: '5',
    name: '스터디 5',
    time: '12:30pm',
    participants: 5,
    avatar: 'https://placekitten.com/204/204',
    isMuted: false 
  },
]);

const toggleMute = (rowKey) => {
  const updatedData = chatData.map((item) =>
    item.id === rowKey ? { ...item, isMuted: !item.isMuted } : item
  );
  setChatData(updatedData);
};

  const renderItem = ({ item }) => (
    <View style={styles.rowFront}>
    <TouchableOpacity style={styles.chatItem} onPress={() => navigation.navigate('채팅화면')}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.ParticipantsCount}> {item.participants}</Text>
        </View>
        <Text style={styles.LastChat}>마지막 채팅내용</Text>
      </View>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
    </View>
  );

   const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity style={styles.backRightBtn} onPress={() => toggleMute(item.id)}>
        <Ionicons
        name={item.isMuted ? 'notifications-outline' : 'notifications-off-outline'}
        size={24}
        color="#fff"
      />
        <Text style={{ color: 'white' }}> {item.isMuted ? '알림켜기' : '알림끄기'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SwipeListView
          data={chatData}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-90}
          disableRightSwipe
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 ,
            paddingHorizontal: 0
          }}
        />
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
    
  },
  
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterText: {
    color: '#888',
    fontWeight: 'bold',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  rowFront: {
  backgroundColor: '#fff',
  justifyContent: 'center',
  height: 80, 
  marginBottom: 10,
  overflow: 'hidden',
  width: '100%',
},
rowBack: {
  alignItems: 'center',
  backgroundColor: '#d11a2a',
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'flex-end',
  paddingRight: 0,
  height: 80, 
  marginBottom: 10,
  marginLeft: '5%',
  width: '95%',
},

  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, 
  backgroundColor: '#fff', 
  paddingHorizontal: 10,
  borderRadius: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  ParticipantsCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,

  },
  LastChat: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  time: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },


backRightBtn: {
  alignItems: 'center',
  justifyContent: 'center',
  width: 90,
  height: '100%',
},
  
});

export default ChatListScreen;