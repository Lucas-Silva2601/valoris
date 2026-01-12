// Script de teste para construir uma casa no Brasil
// Usa fetch nativo do Node.js 18+

const testBuild = async () => {
  try {
    console.log('🧪 Testando construção de casa no Brasil...');
    console.log('📍 Coordenadas: lat=-14.2350, lng=-51.9253 (Centro do Brasil)');
    console.log('🏠 Tipo: house, Level: 1');
    console.log('');
    
    const response = await fetch('http://localhost:5000/api/buildings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'house',
        lat: -14.2350,
        lng: -51.9253,
        level: 1,
        userId: 'test-user-id',
        countryId: 'BRA',
        countryName: 'Brazil'
      })
    });
    
    const data = await response.json();
    
    console.log('✅ Status:', response.status);
    console.log('');
    console.log('📦 Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error('❌ Erro na construção:', data.error);
      if (data.message) {
        console.error('   Mensagem:', data.message);
      }
    } else {
      console.log('');
      console.log('✅ Construção bem-sucedida!');
      console.log('   Building ID:', data.building?.buildingId);
      console.log('   País:', data.building?.countryName, `(${data.building?.countryId})`);
      console.log('   Posição:', data.building?.position?.lat, data.building?.position?.lng);
    }
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Servidor não está rodando! Execute "npm run dev" primeiro.');
    }
  }
};

testBuild();

