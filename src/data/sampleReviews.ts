import type { HomeReviews } from '../api/reviews'
import type { Review } from '../api/types'

/**
 * 견본 후기 — 로컬에서 서버(BE) 없이 메인의 후기 구간 모양을 볼 때만 쓴다.
 * api/reviews.ts 가 개발 화면(import.meta.env.DEV)에서만 불러오므로 운영 빌드에는 들어가지 않는다.
 * 실제 손님 글이 아니다 — 운영 화면에 절대 쓰지 말 것. 효능 표현도 넣지 않는다.
 */
const sample = (id: number, rating: number, best: boolean, author: string, optionName: string, day: string, content: string): Review => ({
  id,
  productId: 1,
  productName: '돌돌 제주산 100% NFC 레드비트즙',
  optionName,
  rating,
  content,
  imageUrls: [],
  author,
  best,
  hidden: false,
  reply: null,
  repliedAt: null,
  createdAt: `${day}T10:00:00`,
  memberId: null,
  memberEmail: null,
})

export const SAMPLE_HOME_REVIEWS: HomeReviews = {
  sample: true,
  summary: { total: 6, average: 4.7, counts: [4, 2, 0, 0, 0] },
  reviews: [
    sample(1, 5, true, '김*영', '30포', '2026-11-20', '비트 특유의 흙내가 덜하고 맛이 깔끔해요. 물을 안 탔다더니 진하긴 한데 끝맛이 달큰해서 아침마다 한 포씩 마시고 있어요.'),
    sample(2, 5, true, '최*호', '60포', '2026-11-18', '부모님 댁에 보내 드렸는데 포장이 꼼꼼하게 왔다고 하시네요. 오후 2시 전에 주문했더니 다음 날 도착했어요.'),
    sample(3, 5, false, '이*준', '30포', '2026-11-15', '파우치라 출근길에 들고 나가기 편해요. 뚜껑이 있어서 반만 마시고 닫아 둘 수 있는 것도 좋고요.'),
    sample(4, 4, false, '박*연', '60포', '2026-11-12', '맛은 만족하는데 60포는 상자가 꽤 커요. 냉장고 자리를 미리 비워 두세요.'),
    sample(5, 5, false, '정*민', '30포', '2026-11-09', '다른 비트즙은 사과나 배가 섞여 있었는데 이건 비트만 들어 있어서 골랐어요. 차게 해서 마시면 더 맛있어요.'),
    sample(6, 4, false, '한*서', '30포', '2026-11-05', '처음엔 진해서 놀랐는데 며칠 마시니 익숙해졌어요. 다 마시고 한 상자 더 주문했습니다.'),
  ],
}
