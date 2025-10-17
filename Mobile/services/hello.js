import React, { useEffect } from 'react';
import { Text } from 'react-native';
import api from './services/api';

export default function PingTest() {
  useEffect(() => {
    api.get('/ping')
      .then(res => console.log('ping ok ->', res.data))
      .catch(err => console.error('ping error ->', err.message));
  }, []);

  return <Text>Check console/logs for ping result</Text>;
}
