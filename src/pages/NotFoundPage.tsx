import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/buttonStyles'

export default function NotFoundPage() {
  return (
    <div className="dd-hero-note">
      <p className="big">404</p>
      <h1>페이지를 찾을 수 없어요</h1>
      <p>주소가 바뀌었거나 없어진 페이지예요.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClass('primary')}>
          홈으로
        </Link>
        <Link to="/faq" className={buttonClass('secondary')}>
          자주 묻는 질문
        </Link>
      </div>
    </div>
  )
}
