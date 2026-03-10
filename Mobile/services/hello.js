import React, { useEffect } from 'react';
import { Text } from 'react-native';
import api from './services/api';
import logger from '../utils/logger';

const log = logger.create('Hello');

export default function PingTest() {
  useEffect(() => {
    api.get('/ping')
      .then(res => log.info('ping ok ->', res.data))
      .catch(err => log.error('ping error ->', err.message));
  }, []);

  return <Text>Check console/logs for ping result</Text>;
}
