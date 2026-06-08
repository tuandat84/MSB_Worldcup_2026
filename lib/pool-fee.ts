/** Phí quỹ theo kết quả dự đoán (VND) */
export const FEE_WRONG_BOTH = 10_000 // 0 điểm — sai cả tính chất lẫn tỷ số
export const FEE_WRONG_ONE = 5_000 // 1 điểm — đúng một trong hai
export const FEE_NO_PREDICTION = 10_000 // không dự đoán — 0 điểm
export const FEE_PERFECT = 0 // 2 điểm — đúng hoàn toàn

/** Tính số tiền phải đóng cho một trận (chỉ áp dụng khi đã có điểm) */
export function calculatePoolFee(
  points: number | null | undefined,
  isMissed?: boolean
): number {
  if (isMissed) return FEE_NO_PREDICTION
  if (points === null || points === undefined) return 0
  if (points === 0) return FEE_WRONG_BOTH
  if (points === 1) return FEE_WRONG_ONE
  return FEE_PERFECT
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} ₫`
}
