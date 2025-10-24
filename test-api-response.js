// Simple test to check what the frontend API returns
const fetch = require('node-fetch');

async function testFrontendApi() {
  try {
    console.log('🔍 Testing frontend API response...');
    
    const response = await fetch('http://localhost:3000/api/admin/posts');
    const data = await response.json();
    
    console.log('📊 Frontend API Response:');
    console.log('Success:', data.success);
    console.log('Count:', data.count);
    console.log('Total:', data.total);
    
    if (data.rows && data.rows.length > 0) {
      console.log('\n📝 First post details:');
      const firstPost = data.rows[0];
      console.log('Title:', firstPost.title);
      console.log('Author:', firstPost.author);
      console.log('Author Type:', typeof firstPost.author);
      
      if (typeof firstPost.author === 'object' && firstPost.author !== null) {
        console.log('Author Object:', JSON.stringify(firstPost.author, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend API:', error);
  }
}

testFrontendApi();
