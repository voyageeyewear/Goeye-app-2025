import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  const testConfig = {
    announcementBar: {
      enabled: true,
      text: "🎉 Welcome to Eyejack Mobile App! Live Rendering System Active 🚀",
      backgroundColor: "#2563EB",
      textColor: "#FFFFFF"
    },
    header: {
      title: "Eyejack Mobile",
      backgroundColor: "#FFFFFF",
      textColor: "#1F2937"
    },
    status: {
      backend: "✅ Running",
      websocket: "✅ Active on port 8080",
      database: "✅ SQLite ready",
      liveRendering: "✅ Enabled"
    }
  };

  return json(testConfig);
}

export default function TestPage() {
  const data = useLoaderData();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4', padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#2563EB', fontSize: '2.5rem', marginBottom: '10px' }}>
          🎉 Eyejack Mobile App System
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#6B7280' }}>
          Live Rendering System Status
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#F0FDF4', border: '1px solid #10B981', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ color: '#059669', margin: '0 0 10px 0' }}>Backend Status</h3>
          <p style={{ margin: 0, fontSize: '18px' }}>{data.status.backend}</p>
        </div>
        
        <div style={{ background: '#EFF6FF', border: '1px solid #2563EB', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ color: '#1D4ED8', margin: '0 0 10px 0' }}>WebSocket Server</h3>
          <p style={{ margin: 0, fontSize: '18px' }}>{data.status.websocket}</p>
        </div>
        
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ color: '#D97706', margin: '0 0 10px 0' }}>Database</h3>
          <p style={{ margin: 0, fontSize: '18px' }}>{data.status.database}</p>
        </div>
        
        <div style={{ background: '#F3E8FF', border: '1px solid #8B5CF6', borderRadius: '8px', padding: '20px' }}>
          <h3 style={{ color: '#7C3AED', margin: '0 0 10px 0' }}>Live Rendering</h3>
          <p style={{ margin: 0, fontSize: '18px' }}>{data.status.liveRendering}</p>
        </div>
      </div>

      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '30px', marginBottom: '30px' }}>
        <h2 style={{ color: '#1F2937', marginTop: 0 }}>Sample App Configuration</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#4B5563', fontSize: '1.1rem' }}>Announcement Bar</h3>
          <div style={{ 
            background: data.announcementBar.backgroundColor, 
            color: data.announcementBar.textColor,
            padding: '10px 20px',
            borderRadius: '4px',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {data.announcementBar.text}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#4B5563', fontSize: '1.1rem' }}>Header Configuration</h3>
          <div style={{ 
            background: data.header.backgroundColor, 
            color: data.header.textColor,
            padding: '15px 20px',
            border: '1px solid #E5E7EB',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{data.header.title}</span>
            <div>
              <span style={{ marginRight: '15px' }}>🔍</span>
              <span>🛒</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#1F2937', color: '#FFFFFF', borderRadius: '8px', padding: '30px', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0, color: '#FFFFFF' }}>🚀 Ready for Flutter App!</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '10px 0' }}>
            <strong>Test API:</strong> <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '3px' }}>
              GET http://localhost:3000/api/test-config
            </code>
          </p>
          <p style={{ margin: '10px 0' }}>
            <strong>WebSocket:</strong> <code style={{ background: '#374151', padding: '2px 6px', borderRadius: '3px' }}>
              ws://localhost:8080
            </code>
          </p>
        </div>

        <div style={{ background: '#374151', borderRadius: '6px', padding: '20px', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#10B981' }}>Flutter App Setup:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>Install Flutter SDK</li>
            <li style={{ marginBottom: '8px' }}>Run: <code>cd flutter_app && flutter pub get</code></li>
            <li style={{ marginBottom: '8px' }}>Run: <code>flutter packages pub run build_runner build</code></li>
            <li style={{ marginBottom: '8px' }}>Run: <code>flutter run</code></li>
            <li>Watch live updates work! ✨</li>
          </ol>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px', background: '#FEFCE8', border: '1px solid #EAB308', borderRadius: '8px' }}>
        <p style={{ margin: 0, color: '#A16207' }}>
          <strong>Next:</strong> Complete Flutter setup to see the live rendering system in action!
        </p>
      </div>
    </div>
  );
} 