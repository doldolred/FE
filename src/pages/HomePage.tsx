import { useEffect, useState } from 'react'
import { fetchProducts, type Product } from '../api/products'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <p className="error">상품을 불러오지 못했습니다. ({error})</p>

  return (
    <section>
      <h1>상품</h1>
      <ul className="product-grid">
        {products.map((p) => (
          <li key={p.id} className="product-card">
            <h2>{p.name}</h2>
            {p.description && <p>{p.description}</p>}
            <strong>{p.price.toLocaleString('ko-KR')}원</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
