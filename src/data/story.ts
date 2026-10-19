/**
 * 메인 스토리텔링 내용 — 문구 · 사진 · 영상 자리는 여기만 고치면 된다.
 * TODO(고객확인): 산지 · 무첨가 · 공정 같은 사실 문구는 실제 제품 정보로 확인 후 수정
 */

/** 히어로 아래 목차 = 이어지는 장들 */
export const CHAPTERS = [
  ['01', '비트', '#beet'],
  ['02', '과정', '#process'],
  ['03', '약속', '#promise'],
  ['04', '상품', '#shop'],
] as const

/**
 * 1 · 스크롤 필름 — 첫 화면(히어로)이 곧 필름의 시작. 화면은 붙잡혀 있고 스크롤하면 장면이 넘어간다.
 *
 * sequence: 영상에서 뽑은 사진 묶음. 비우면(null) 비트색 그라데이션 자리표시가 보인다.
 *   ffmpeg -i 원본.mp4 -vf "fps=12,scale=1280:-2" -c:v libwebp -quality 62 FE/public/film/f%03d.webp
 *   count 는 뽑힌 파일 수와 같아야 한다 (10초 영상 → 120장).
 */
export const FILM = {
  // 2026-10-19 Gemini 생성 영상(ph/gemini_generated_video_01d911d3.mp4)에서 뽑은 120장 — 실제 촬영본이 오면 교체
  sequence: { base: '/film/f', pad: 3, ext: '.webp', count: 120 } as { base: string; pad: number; ext: string; count: number } | null,
  /** 첫 장 / 움직임 줄임 설정일 때 보이는 정지 사진 — 영상의 마지막 장(완성된 파우치) */
  poster: '/film/poster.webp' as string | null,
  shotHint: '흙 묻은 비트를 씻어 착즙하고 한 포에 담기까지 10초',
  frames: [
    {
      eyebrow: 'THE ROOT',
      title: '흙 속에서 자란 붉은 뿌리',
      body: '제철에 거둔 국내산 비트만 고릅니다.',
    },
    {
      eyebrow: 'THE PRESS',
      title: '통째로, 그대로 짜냅니다',
      body: '깨끗이 씻은 비트를 착즙합니다. 물도, 설탕도 넣지 않습니다.',
    },
    {
      eyebrow: 'THE POUCH',
      title: '하루 한 포의 붉은 습관',
      body: '100ml 한 포씩 담아, 아침에 뜯어 바로 마십니다.',
    },
  ],
}

/** 01 비트 — 왼쪽 표제는 붙잡히고, 약속이 스크롤에 따라 하나씩 밝아진다 */
export const PROMISES = [
  ['01', '국내산 비트만', '산지에서 제철에 거둔 비트를 받아 씁니다. 원산지는 포장에 그대로 적습니다.'],
  ['02', '비트 100%', '물 · 설탕 · 향료를 넣지 않습니다. 한 포에 비트만 담깁니다.'],
  ['03', '한 포씩 위생 포장', '한 번 마실 만큼 나눠 담아, 뜯기 전까지 공기에 닿지 않습니다.'],
] as const

/** 02 과정 — 붙잡힌 무대에서 단계가 하나씩 켜진다 */
export const PROCESS = [
  { key: 'harvest', title: '수확', en: 'HARVEST', body: '제철에 다 자란 비트를 산지에서 거둬들입니다.' },
  { key: 'wash', title: '세척', en: 'WASH', body: '흙과 잔뿌리를 여러 번 씻어 냅니다.' },
  { key: 'press', title: '착즙', en: 'PRESS', body: '비트를 그대로 눌러 짜 즙만 받아 냅니다.' },
  { key: 'sterilize', title: '살균', en: 'STERILIZE', body: '맛과 색을 지키는 온도에서 살균합니다.' },
  { key: 'pack', title: '포장', en: 'PACK', body: '100ml 한 포씩 나눠 담고 밀봉합니다.' },
  { key: 'deliver', title: '배송', en: 'DELIVER', body: '주문을 확인하면 문 앞까지 보내 드립니다.' },
] as const

/** 03 약속 — 낱말이 스크롤에 따라 한 마디씩 읽힌다. 마침표에서 줄이 바뀐다 */
export const MANIFESTO = '좋은 것은 복잡하지 않습니다. 비트를 씻고, 짜고, 담았습니다. 그게 전부입니다.'
