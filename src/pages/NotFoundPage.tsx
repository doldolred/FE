import { Link } from 'react-router-dom'
import { buttonClass } from '../components/ui/buttonStyles'
import { Empty } from '../components/ui/Status'

export default function NotFoundPage() {
  return (
    <Empty>
      <p className="text-4xl font-extrabold text-beet-800">404</p>
      <p className="mt-3">페이지를 찾을 수 없어요.</p>
      <Link to="/" className={buttonClass('primary', 'mt-6')}>
        홈으로
      </Link>
    </Empty>
  )
}
