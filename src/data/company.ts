/**
 * 사업자 정보 — 하단(Footer) · 약관 · 개인정보처리방침에 쓴다. 출처: 고객 자료 「DOLDOL 자사몰 제작」
 * TODO(고객확인) 통신판매업 신고번호: 자료에는 전화번호 형식으로 적혀 있어 신고증의 번호로 다시 받기
 */
export const COMPANY = {
  storeName: 'DOLDOL 돌돌 공식 스토어',
  name: '돌돌 (DOLDOL)',
  ceo: '황호철',
  businessNumber: '563-09-02588',
  mailOrderNumber: '(확인 후 기입)',
  address: '충청북도 제천시 산곡6길 15 (산곡동)',
  csPhone: '010-6720-5865',
  csHours: '평일 10:00 ~ 16:00 (점심 12:00 ~ 13:00) · 주말 · 공휴일 휴무',
  privacyOfficer: '대표 황호철',
  privacyEmail: 'hhc12300@naver.com',
  returnAddress: '충청북도 제천시 백운면 구학산로2길 38-37 공장 1 출입구 (우 27105) 넉넉한사람들',
  courier: 'CJ대한통운',
} as const

/** 공정위 사업자정보 확인 페이지 */
export const BUSINESS_INFO_URL = `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${COMPANY.businessNumber.replaceAll('-', '')}`
