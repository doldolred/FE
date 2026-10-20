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
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        !
      </p>
      <h1 className="mt-4 text-2xl font-bold">결제가 완료되지 않았어요</h1>
      <p className="mt-3 break-keep text-neutral-600">{message}</p>
      {orderNumber && (
        <p className="mt-6 text-sm text-neutral-500">
          주문({orderNumber})은 결제 대기로 남아 있어요. 30분 안에 다시 결제할 수 있어요.
        </p>
      )}
      <div className="mt-10 flex justify-center gap-3">
        {orderNumber && (
          <Link to={`/mypage/orders/${orderNumber}`} className={buttonClass('primary')}>
            다시 결제하기
          </Link>
        )}
        <Link to="/" className={buttonClass('secondary')}>
          홈으로
        </Link>
      </div>
    </div>
  )
}
