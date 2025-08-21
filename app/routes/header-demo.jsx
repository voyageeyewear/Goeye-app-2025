export default function HeaderDemo() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header matching the design */}
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
          <button style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
          }}>
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
            gap: '4px'
          }}>
            🛍️ 50% OFF
          </div>
        </div>

        {/* Center section - Logo */}
        <div style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          oe
        </div>

        {/* Right section - Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Wishlist/Heart Icon */}
          <button style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px'
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
            padding: '4px'
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
            padding: '4px'
          }}>
            🛒
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div style={{
        backgroundColor: '#4A5568', // Same as header
        padding: '0 16px 12px 16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '25px',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <input
            type="text"
            placeholder="Search products..."
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
            color: '#9CA3AF',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px'
          }}>
            🔍
          </button>
        </div>
      </div>

      {/* Demo Content */}
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ color: '#1F2937', marginBottom: '20px' }}>
          🎉 Header Design Implemented!
        </h1>
        <p style={{ color: '#6B7280', fontSize: '18px', marginBottom: '30px' }}>
          This header matches your design exactly with:
        </p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1F2937', marginBottom: '10px' }}>✅ Dark Header</h3>
            <p style={{ color: '#6B7280', margin: 0 }}>Matching blue-gray background color</p>
          </div>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1F2937', marginBottom: '10px' }}>✅ 50% OFF Badge</h3>
            <p style={{ color: '#6B7280', margin: 0 }}>Red promotional badge with icon</p>
          </div>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1F2937', marginBottom: '10px' }}>✅ "oe" Logo</h3>
            <p style={{ color: '#6B7280', margin: 0 }}>Centered brand logo with spacing</p>
          </div>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1F2937', marginBottom: '10px' }}>✅ Action Icons</h3>
            <p style={{ color: '#6B7280', margin: 0 }}>Heart, user, and cart icons</p>
          </div>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1F2937', marginBottom: '10px' }}>✅ Search Bar</h3>
            <p style={{ color: '#6B7280', margin: 0 }}>Rounded search with placeholder</p>
          </div>
          <div style={{ 
            background: '#F3F4F6', 
            padding: '20px', 
            borderRadius: '12px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1F2937', marginBottom: '10px' }}>✅ Responsive</h3>
            <p style={{ color: '#6B7280', margin: 0 }}>Mobile-friendly layout</p>
          </div>
        </div>
        
        <div style={{ marginTop: '40px' }}>
          <a 
            href="/test" 
            style={{
              backgroundColor: '#2563EB',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              marginRight: '10px'
            }}
          >
            🚀 View System Status
          </a>
          <a 
            href="/" 
            style={{
              backgroundColor: 'transparent',
              color: '#2563EB',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              border: '2px solid #2563EB'
            }}
          >
            🏠 Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
