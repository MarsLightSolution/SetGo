// Test script to verify authentication system
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8080';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  // Test 1: Register a new user
  console.log('1. Testing Registration...');
  try {
    const registerResponse = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
  } catch (error) {
    console.error('Registration error:', error.message);
  }

  // Test 2: Login
  console.log('\n2. Testing Login...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (loginResponse.ok) {
      // Test 3: Protected route
      console.log('\n3. Testing Protected Route...');
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('Cookies received:', cookies);

      const protectedResponse = await fetch(`${BASE_URL}/protected`, {
        method: 'GET',
        headers: {
          'Cookie': cookies || '',
          'Content-Type': 'application/json',
        }
      });

      const protectedData = await protectedResponse.json();
      console.log('Protected route response:', protectedData);
    }
  } catch (error) {
    console.error('Login error:', error.message);
  }

  // Test 4: Chat connection
  console.log('\n4. Testing Chat Connection...');
  try {
    const chatResponse = await fetch(`${BASE_URL}/api/chat/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser'
      })
    });

    const chatData = await chatResponse.json();
    console.log('Chat connection response:', chatData);
  } catch (error) {
    console.error('Chat connection error:', error.message);
  }

  console.log('\n✅ Authentication test completed!');
}

testAuth().catch(console.error);