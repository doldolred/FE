import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { fetchCart, fetchShippingQuote } from "../api/cart";
import { checkCoupon } from "../api/coupons";
import { createOrder } from "../api/orders";
import { queryKeys } from "../api/queryKeys";
import type { CouponCheck, CreateOrderRequest } from "../api/types";
import OrderSummaryBox from "../components/order/OrderSummaryBox";
import CheckoutSteps from "../components/store/CheckoutSteps";
import PageHead from "../components/store/PageHead";
import ProductThumb from "../components/store/ProductThumb";
import PayMethodPicker from "../components/order/PayMethodPicker";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ErrorMessage, Loading } from "../components/ui/Status";
import { getErrorMessage, getFieldErrors } from "../lib/errors";
import { formatPrice } from "../lib/format";
import { PAYMENT_ENABLED, type PayMethod } from "../lib/payment";
import { searchAddress } from "../lib/postcode";
import { usePayment } from "../hooks/usePayment";
import { useAuthStore } from "../stores/authStore";

export default function CheckoutPage() {
  const memberName = useAuthStore((s) => s.member?.name ?? "");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateOrderRequest>({
    receiverName: memberName,
    receiverPhone: "",
    zipcode: "",
    address1: "",
    address2: "",
    memo: "",
  });
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  // 할인코드 — 미리보기로 확인한 것만 주문에 실어 보낸다 (주문할 때 서버가 다시 계산)
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponCheck | null>(null);
  const couponMutation = useMutation({
    mutationFn: checkCoupon,
    onSuccess: setCoupon,
  });
  const [addressError, setAddressError] = useState<string | null>(null);
  const { pay, paying } = usePayment();
  const set =
    (key: keyof CreateOrderRequest) => (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const {
    data: cart,
    isPending,
    error,
  } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart });

  // 우편번호가 들어오면 제주 · 도서 추가 배송비까지 서버에 물어본다 (주문 때도 서버가 같은 규칙으로 계산)
  const validZip = /^\d{5}$/.test(form.zipcode);
  const quote = useQuery({
    queryKey: ["shipping-quote", cart?.itemsPrice, form.zipcode],
    queryFn: () => fetchShippingQuote(cart!.itemsPrice, form.zipcode),
    enabled: !!cart && cart.items.length > 0 && validZip,
  });
  const shippingFee =
    validZip && quote.data ? quote.data.fee : (cart?.shippingFee ?? 0);
  const discountAmount = coupon?.discountAmount ?? 0;
  const totalPrice = (cart?.itemsPrice ?? 0) - discountAmount + shippingFee;

  const handleSearchAddress = async () => {
    setAddressError(null);
    try {
      const picked = await searchAddress();
      setForm((f) => ({ ...f, ...picked }));
    } catch (e) {
      setAddressError(getErrorMessage(e));
    }
  };

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.setQueryData(queryKeys.order(order.orderNumber), order);
      // 주문(결제 대기)을 먼저 만들고 그 금액으로 결제창을 띄운다. 키가 아직 없으면 결제 대기로 접수만
      if (PAYMENT_ENABLED) pay(order, payMethod);
      else
        navigate(`/mypage/orders/${order.orderNumber}?complete=1`, {
          replace: true,
        });
    },
  });
  const fieldErrors = getFieldErrors(orderMutation.error);

  if (isPending) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  // 주문 완료 직후에는 장바구니가 비므로 orderMutation 성공 여부를 같이 확인
  if (cart.items.length === 0 && !orderMutation.isSuccess)
    return <Navigate to="/cart" replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    orderMutation.mutate({ ...form, couponCode: coupon?.code });
  };

  return (
    <form onSubmit={handleSubmit}>
      <CheckoutSteps current={1} />
      <PageHead
        kicker="CHECKOUT"
        title="주문 · 결제"
        sub="받으실 곳을 적고 결제하면 끝이에요."
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="dd-box">
            <h2>배송지</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="받는 분"
                required
                maxLength={50}
                value={form.receiverName}
                onChange={set("receiverName")}
                error={fieldErrors.receiverName}
              />
              <Input
                label="연락처"
                required
                type="tel"
                placeholder="010-0000-0000"
                value={form.receiverPhone}
                onChange={set("receiverPhone")}
                error={fieldErrors.receiverPhone}
              />
              <div className="flex items-end gap-2 sm:col-span-2">
                <Input
                  label="우편번호"
                  required
                  inputMode="numeric"
                  maxLength={5}
                  className="w-32"
                  value={form.zipcode}
                  onChange={set("zipcode")}
                  error={fieldErrors.zipcode}
                />
                <Button
                  variant="secondary"
                  onClick={handleSearchAddress}
                  className="mb-px"
                >
                  주소 검색
                </Button>
              </div>
              {addressError && (
                <p className="text-xs text-red-600 sm:col-span-2">
                  {addressError}
                </p>
              )}
              <Input
                label="주소"
                required
                className="sm:col-span-2"
                value={form.address1}
                onChange={set("address1")}
                error={fieldErrors.address1}
              />
              <Input
                label="상세주소"
                className="sm:col-span-2"
                value={form.address2}
                onChange={set("address2")}
                error={fieldErrors.address2}
              />
              <Input
                label="배송 메모"
                className="sm:col-span-2"
                placeholder="예) 문 앞에 놓아주세요"
                value={form.memo}
                onChange={set("memo")}
                error={fieldErrors.memo}
              />
            </div>
          </section>

          <section className="dd-box">
            <div className="dd-box-title">
              <span>주문 상품 {cart.items.length}개</span>
              <Link to="/cart">장바구니 수정</Link>
            </div>
            <ul className="dd-rows">
              {cart.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <ProductThumb
                    productId={item.productId}
                    imageUrl={item.imageUrl}
                    name={item.productName}
                    className="w-14 shrink-0 rounded-xl!"
                  />
                  <span className="min-w-0 flex-1 break-keep">
                    <b>{item.productName}</b> {item.optionName}{" "}
                    <span className="text-neutral-500">× {item.quantity}</span>
                  </span>
                  <span className="font-black">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="dd-box">
            <h2>할인코드</h2>
            {coupon ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#222021] bg-[#f6d4cf] px-4 py-3">
                <p className="text-sm">
                  <b className="font-mono">{coupon.code}</b> · {coupon.name}
                  <span className="ml-2 font-bold text-beet-700">
                    −{formatPrice(coupon.discountAmount)}
                  </span>
                </p>
                <button
                  type="button"
                  className="text-sm text-neutral-500 underline"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput("");
                    couponMutation.reset();
                  }}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="ui-field h-12 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 font-mono uppercase outline-none focus:border-beet-700"
                  placeholder="코드를 입력하세요"
                  maxLength={30}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    // 입력칸에서 엔터를 눌러도 주문이 넘어가지 않고 코드만 확인
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (couponInput.trim())
                        couponMutation.mutate(couponInput.trim());
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  disabled={!couponInput.trim() || couponMutation.isPending}
                  onClick={() => couponMutation.mutate(couponInput.trim())}
                >
                  적용
                </Button>
              </div>
            )}
            {couponMutation.error && (
              <p className="mt-2 text-sm text-red-600">
                {getErrorMessage(couponMutation.error)}
              </p>
            )}
          </section>

          {PAYMENT_ENABLED && (
            <section className="dd-box">
              <PayMethodPicker
                value={payMethod}
                onChange={setPayMethod}
                disabled={orderMutation.isPending || paying}
              />
            </section>
          )}
        </div>

        <OrderSummaryBox
          itemsPrice={cart.itemsPrice}
          shippingFee={shippingFee}
          discountAmount={discountAmount}
          couponCode={coupon?.code}
          areaName={validZip ? quote.data?.areaName : null}
          freeThreshold={cart.freeShippingThreshold}
        >
          {orderMutation.error && (
            <div className="mt-4">
              <ErrorMessage error={orderMutation.error} />
            </div>
          )}
          <Button
            type="submit"
            className="mt-6 w-full"
            disabled={orderMutation.isPending || paying}
          >
            {orderMutation.isPending || paying
              ? "결제 준비 중…"
              : `${formatPrice(totalPrice)} ${PAYMENT_ENABLED ? "결제하기" : "주문하기"}`}
          </Button>
          <p className="mt-3 text-center text-xs text-neutral-500">
            {PAYMENT_ENABLED
              ? "결제창을 닫아도 주문은 30분 동안 남아 있어 다시 결제할 수 있어요."
              : "결제 연동 전이라 주문은 '결제 대기'로 접수돼요."}
          </p>
        </OrderSummaryBox>
      </div>
    </form>
  );
}
