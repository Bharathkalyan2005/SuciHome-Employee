
export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src="/logo.png" 
          alt="SuciHome Loading Logo" 
          style={{ height: '64px', width: 'auto' }} 
        />
        <div style={{
          marginTop: '16px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#1B4332',
        }}>
          Loading...
        </div>
      </div>
    </div>
  );
}
