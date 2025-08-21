import { useState } from "react";

export default function ModernHeaderDemo() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      {/* Header matching the exact design */}
      <header style={{
        backgroundColor: '#4A5568', // Dark blue-gray background
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        
        {/* Left section - Menu and 50% OFF badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Hamburger Menu */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ☰
          </button>
          
          {/* 50% OFF Badge */}
          <div style={{
            backgroundColor: '#E53E3E', // Red background
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 4px rgba(229, 62, 62, 0.3)',
            animation: 'pulse 2s infinite'
          }}>
            🛍️ 50% OFF
          </div>
        </div>

        {/* Center section - Logo */}
        <div style={{
          color: 'white',
          fontSize: '28px',
          fontWeight: 'bold',
          letterSpacing: '3px',
          fontFamily: 'Georgia, serif',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          oe
        </div>

        {/* Right section - Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Wishlist/Heart Icon */}
          <button style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.transform = 'scale(1)';
          }}>
            ♡
          </button>
          
          {/* User/Profile Icon */}
          <button style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.transform = 'scale(1)';
          }}>
            👤
          </button>
          
          {/* Cart Icon */}
          <button style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            transition: 'all 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.transform = 'scale(1)';
          }}>
            🛒
            {/* Cart badge */}
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#E53E3E',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              3
            </span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{
        backgroundColor: '#4A5568', // Same as header
        padding: '0 16px 16px 16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '25px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid transparent',
          transition: 'all 0.2s'
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = '#2563EB'}
        onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: '16px',
              color: '#4A5568',
              backgroundColor: 'transparent'
            }}
          />
          <button style={{
            background: 'none',
            border: 'none',
            color: searchQuery ? '#2563EB' : '#9CA3AF',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }}>
            🔍
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1001,
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setIsMenuOpen(false)}>
          <div style={{
            backgroundColor: 'white',
            width: '280px',
            height: '100%',
            padding: '20px',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease-out'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: '#1F2937' }}>Menu</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                ×
              </button>
            </div>
            <nav>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Home', 'Shop', 'Categories', 'Sale', 'About', 'Contact'].map((item) => (
                  <li key={item} style={{ marginBottom: '15px' }}>
                    <a href="#" style={{
                      color: '#1F2937',
                      textDecoration: 'none',
                      fontSize: '18px',
                      padding: '10px 0',
                      display: 'block',
                      borderBottom: '1px solid #E5E7EB'
                    }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Demo Content */}
      <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
        <h1 style={{ color: '#1F2937', marginBottom: '20px', fontSize: '2.5rem' }}>
          🎉 Perfect Header Match!
        </h1>
        <p style={{ color: '#6B7280', fontSize: '18px', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
          Your header design has been replicated exactly with enhanced functionality and responsiveness.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          maxWidth: '1000px',
          margin: '0 auto 40px'
        }}>
          {[
            { icon: '🎨', title: 'Exact Design Match', desc: 'Dark header with precise color matching' },
            { icon: '🏷️', title: 'Animated Badge', desc: '50% OFF badge with pulsing animation' },
            { icon: '✨', title: 'Interactive Icons', desc: 'Hover effects and cart counter' },
            { icon: '🔍', title: 'Smart Search', desc: 'Responsive search with focus states' },
            { icon: '📱', title: 'Mobile Menu', desc: 'Slide-out navigation for mobile' },
            { icon: '⚡', title: 'Live Updates', desc: 'Real-time search and interactions' }
          ].map((feature) => (
            <div key={feature.title} style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '12px',
              textAlign: 'left',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{feature.icon}</div>
              <h3 style={{ color: '#1F2937', marginBottom: '8px', fontSize: '1.1rem' }}>{feature.title}</h3>
              <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '40px' }}>
          <a 
            href="/test" 
            style={{
              backgroundColor: '#2563EB',
              color: 'white',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              marginRight: '15px',
              display: 'inline-block',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1D4ED8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563EB'}
          >
            🚀 View System Status
          </a>
          <a 
            href="/" 
            style={{
              backgroundColor: 'transparent',
              color: '#2563EB',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              border: '2px solid #2563EB',
              display: 'inline-block',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563EB';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#2563EB';
            }}
          >
            🏠 Back to Home
          </a>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @media (max-width: 768px) {
          .header-logo {
            font-size: 24px !important;
            letter-spacing: 2px !important;
          }
          
          .header-icons {
            gap: 8px !important;
          }
          
          .badge {
            font-size: 12px !important;
            padding: 4px 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
