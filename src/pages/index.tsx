import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'umi';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // 只在首次渲染时检查，避免重复重定向
    if (!hasRedirected.current) {
      // 检查用户是否主动点击过主页链接
      const hasClickedHome = sessionStorage.getItem('hasClickedHome');
      
      // 如果用户没有主动点击过主页，且是直接访问根路径，则重定向到 docs
      if (!hasClickedHome) {
        // 检查是否是直接访问（referrer 为空或是外部来源）
        const isDirectAccess = !document.referrer || 
                               !document.referrer.includes(window.location.host);
        
        if (isDirectAccess && (location.pathname === '/' || location.pathname === '')) {
          hasRedirected.current = true;
          navigate('/docs', { replace: true });
        }
      }
    }
  }, [navigate, location]);

  return (
    <div>
      工具网站
    </div>
  );
}
