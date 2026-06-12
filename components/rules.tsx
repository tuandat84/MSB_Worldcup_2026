"use client"

import {
  ScrollText,
  Target,
  Trophy,
  // Wallet,
  // Gift,
  Clock,
  Ban,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { POINT_EXACT, POINT_OUTCOME } from "@/lib/match-scoring"
// import {
//   FEE_WRONG_BOTH,
//   FEE_WRONG_ONE,
//   formatVnd,
// } from "@/lib/pool-fee"

function RuleRow({
  title,
  detail,
  accent,
}: {
  title: string
  detail: string
  accent?: string
}) {
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-b-0 last:pb-0">
      <span
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${accent ?? "bg-muted text-muted-foreground"}`}
      >
        •
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-card-foreground">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

export function RulesPage() {
  return (
    <section className="w-full max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ScrollText className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Thể lệ MSB Data World Cup 2026
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Luật chơi và cách tính điểm
          </p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4 text-primary" />
            Luật chơi
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RuleRow
            title="Đối tượng tham gia"
            detail="Toàn bộ thành viên Phòng Phát triển giải pháp và Dịch vụ dữ liệu đăng ký tài khoản trên hệ thống (trừ tài khoản quản trị)."
          />
          <RuleRow
            title="Phạm vi dự đoán"
            detail="Dự đoán tỷ số các trận đấu của World Cup 2026 (104 trận). Có thể nhập trực tiếp tại Lịch thi đấu hoặc vào trang chi tiết từng trận."
          />
          <RuleRow
            title="Thời hạn dự đoán"
            detail="Chỉ được dự đoán hoặc sửa dự đoán trước giờ kick-off chính thức. Khi trận bắt đầu, hệ thống tự khóa — không nhập thêm được."
            accent="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          />
          <RuleRow
            title="Không dự đoán"
            detail="Nếu không gửi dự đoán trước giờ đá, được tính 0 điểm cho trận đó."
            accent="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4 text-primary" />
            Luật tính điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RuleRow
            title={`Đúng tỷ số — +${POINT_EXACT} điểm`}
            detail="Dự đoán trùng khớp cả bàn thắng đội A và đội B với kết quả thực tế. Ví dụ: kết quả 2-1, dự đoán 2-1."
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
          <RuleRow
            title={`Đúng tính chất — +${POINT_OUTCOME} điểm`}
            detail="Dự đoán đúng kết quả thắng / hòa / thua nhưng lệch tỷ số. Ví dụ: kết quả 2-1 (đội A thắng), dự đoán 1-0 (vẫn đội A thắng)."
            accent="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
          />
          <RuleRow
            title="Sai — 0 điểm"
            detail="Dự đoán sai cả tính chất lẫn tỷ số. Ví dụ: kết quả 2-1, dự đoán 1-3."
            accent="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          />
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            Bảng xếp hạng sắp xếp theo tổng điểm tích lũy. Hòa điểm thì ưu tiên số lần đúng tỷ số, sau đó theo tên.
          </p>
        </CardContent>
      </Card>

      {/*
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4 text-primary" />
            Luật tính tiền quỹ
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="mb-3 text-sm text-muted-foreground">
            Sau mỗi trận đã kết thúc, hệ thống tính số tiền mỗi người phải đóng vào quỹ chung
            (hiển thị tại Bảng xếp hạng → cột &quot;Phải đóng&quot;).
          </p>
          <RuleRow
            title={`Không dự đoán hoặc sai hoàn toàn — ${formatVnd(FEE_WRONG_BOTH)}`}
            detail="0 điểm: bỏ lỡ trận hoặc sai cả tính chất lẫn tỷ số."
            accent="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
          />
          <RuleRow
            title={`Đúng tính chất, lệch tỷ số — ${formatVnd(FEE_WRONG_ONE)}`}
            detail={`+${POINT_OUTCOME} điểm: đoán đúng thắng/hòa/thua nhưng không trúng tỷ số chính xác.`}
            accent="bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          />
          <RuleRow
            title="Đúng tỷ số — miễn phí"
            detail={`+${POINT_EXACT} điểm: trúng tỷ số chính xác — không phải đóng tiền cho trận đó.`}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-amber-600 dark:text-amber-400" />
            Giải thưởng đặc biệt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="rounded-lg border border-amber-200 bg-background px-4 py-3 dark:border-amber-500/20">
            <p className="text-sm font-semibold text-foreground">
              Top 1 bảng xếp hạng — anh Đạt thưởng 500K
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Người đứng đầu BXH khi kết thúc giải (theo tổng điểm tích lũy).
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-background px-4 py-3 dark:border-amber-500/20">
            <p className="text-sm font-semibold text-foreground">
              Top cuối bảng xếp hạng — anh Thành thưởng 300K
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Người xếp cuối BXH khi kết thúc giải (vẫn tham gia đủ các trận theo quy định nhóm).
            </p>
          </div>
        </CardContent>
      </Card>
      */}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="size-4 text-muted-foreground" />
            Ghi chú thêm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Ban className="mt-0.5 size-4 shrink-0" />
            Kết quả trận đấu được cập nhật tự động từ nguồn bên ngoài; quản trị viên chỉ nhập tay khi
            tự động thất bại.
          </p>
          <p>
            Mọi thắc mắc về thể lệ liên hệ quản trị viên nhóm hoặc xem lại tại mục Bảng xếp hạng.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
