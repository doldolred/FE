import { Link, useSearchParams } from 'react-router-dom'
import { buttonClass } from '../components/ui/buttonStyles'

/**
 * 결제 실패 · 창 닫음. 나이스페이는 BE 가 여기로 돌려보내고(?orderNumber=&message=),
 * 포트원 · 창 닫음은 FE 가 직접 보낸다. 주문은 결제 대기로 남아 있으니 주문 상세에서 다시 결제할 수 있다.
 */
export default function CheckoutFailPage() {
  const [params] = useSearchParams()
  const orderNumber = params.get('orderNumber')
  const message = params.get('message') || '결제가 완료되지 않았어요.'

  return (
    <div className="dd-hero-note mx-auto max-w-lg">
      <p className="big">Oops!</p>
      <h1>결제가 완료되지 않았어요</h1>
      <p>{message}</p>
      {orderNumber && (
        <div className="dd-box mt-8 text-left text-sm">
          주문 <b>{orderNumber}</b> 은 결제 대기로 남아 있어요. 30분 안에 다시 결제할 수 있어요.
        </div>
      )}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {orderNumber && (
          <Link to={`/mypage/orders/${orderNumber}`} className={buttonClass('primary')}>
            다시 결제하기
          </Link>
        )}
        <Link to="/cart" className={buttonClass('secondary')}>
          장바구니로
        </Link>
      </div>
    </div>
  )
}
