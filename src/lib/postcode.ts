/**
 * 다음(카카오) 우편번호 서비스 — 무료, 키 필요 없음. 주소 검색 버튼을 누를 때 처음 한 번만 스크립트를 받는다.
 * https://postcode.map.daum.net/guide
 */
const SCRIPT_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

interface PostcodeData {
  zonecode: string
  roadAddress: string
  jibunAddress: string
  userSelectedType: 'R' | 'J'
  bname: string
  buildingName: string
  apartment: 'Y' | 'N'
}

declare global {
  interface Window {
    daum?: { Postcode: new (options: { oncomplete: (data: PostcodeData) => void }) => { open: () => void } }
  }
}

let loading: Promise<void> | null = null

function load(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve()
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      loading = null
      reject(new Error('주소 검색을 불러오지 못했어요. 우편번호와 주소를 직접 적어 주세요.'))
    }
    document.head.appendChild(script)
  })
  return loading
}

export interface PickedAddress {
  zipcode: string
  address1: string
}

/** 주소 검색 창을 띄우고, 고르면 우편번호 · 도로명 주소(동 · 건물명 덧붙임)를 돌려준다 */
export async function searchAddress(): Promise<PickedAddress> {
  await load()
  return new Promise((resolve) => {
    new window.daum!.Postcode({
      oncomplete: (d) => {
        const base = d.userSelectedType === 'R' ? d.roadAddress : d.jibunAddress
        const extra = d.userSelectedType === 'R' ? [d.bname, d.apartment === 'Y' ? d.buildingName : ''].filter(Boolean).join(', ') : ''
        resolve({ zipcode: d.zonecode, address1: extra ? `${base} (${extra})` : base })
      },
    }).open()
  })
}
