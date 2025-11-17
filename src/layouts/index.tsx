import { Link, Outlet } from 'umi';
import styles from './index.less';

export default function Layout() {
  return (
    <div className={styles.navs}>
      <ul>
        <li>
          <Link to="/">Hom123e</Link>
        </li>
        <li>
          <Link to="/docs">Doc123123s</Link>
        </li>
      </ul>
      <Outlet />
    </div>
  );
}
