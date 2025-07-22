import React from 'react';
import { StyleSheet,View, Text } from 'react-native';

export default function ReviewScreen() {
  return (
    <View>
      <Text style={styles.chatText}>리뷰 화면입니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  
  chatText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 420,
    marginLeft: 125,
  },

});