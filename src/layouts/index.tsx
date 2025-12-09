import { Link, Outlet } from 'umi';
import styles from './index.less';

export default function Layout() {
  const handleHomeClick = () => {
    // 标记用户主动点击了主页链接
    sessionStorage.setItem('hasClickedHome', 'true');
  };

  return (
    <div className={styles.navs}>
      <ul>
        {/* <li>
          <Link to="/" onClick={handleHomeClick}>主页</Link>
        </li> */}
        {/* <li>
          <Link to="/docs">PDF</Link>
        </li> */}
      </ul>
      <Outlet />
    </div>
  );
}
