# Hướng Dẫn Kỹ Thuật: Cấu Hình Thay Đổi Tên Miền Hệ Thống
*KenVideo Stock Platform - Hướng dẫn chi tiết quy trình chuyển đổi tên miền*

---

> [!IMPORTANT]
> **Lưu ý cực kỳ quan trọng:**
> Toàn bộ đường dẫn và liên kết nội bộ trong mã nguồn dự án đều được thiết kế dưới dạng **Liên kết tương đối (Relative URL)**. Vì vậy, bạn **không cần chỉnh sửa hay thay đổi bất kỳ dòng code nào** trong dự án. Tất cả thao tác chuyển đổi đều được thực hiện thông qua cấu hình hệ thống bên ngoài!

Khi bạn đổi tên miền của trang web từ `https://ken-video-stock.vercel.app` sang tên miền mới (ví dụ: `https://mrkenmedia.vercel.app` hoặc tên miền riêng của bạn), hãy thực hiện tuần tự theo 3 bước hướng dẫn chi tiết dưới đây:

---

## Bước 1: Thêm Tên Miền Mới & Cập Nhật Biến Môi Trường trên Vercel

Bước này giúp Vercel nhận diện tên miền mới và định tuyến lưu lượng truy cập của khách hàng chính xác về ứng dụng Next.js.

1. **Đăng nhập** vào tài khoản **Vercel** quản trị dự án của bạn.
2. Chọn dự án và đi tới mục **Settings (Cài đặt)** -> Chọn tab **Domains (Tên miền)**.
3. Nhập tên miền mới của bạn (ví dụ: `mrkenmedia.vercel.app`) vào ô nhập liệu và nhấn **Add (Thêm)**.
4. Chuyển sang tab **Environment Variables (Biến môi trường)**:
   * Tìm biến có tên là **`NEXTAUTH_URL`**.
   * Nhấn nút chỉnh sửa giá trị và đổi sang tên miền mới của bạn:
     ```text
     https://mrkenmedia.vercel.app
     ```
5. **Redeploy lại dự án:** Sau khi lưu biến môi trường, hãy chuyển sang tab **Deployments (Bản triển khai)**, nhấp vào nút 3 chấm bên cạnh bản build mới nhất và chọn **Redeploy (Triển khai lại)** để Vercel nạp cấu hình mới này vào mã chạy thực tế.

---

## Bước 2: Cập Nhật Cấu Hình Nhận Webhook trên SePay.vn

Để tính năng quét mã QR thanh toán tự động và chuyển hướng tức thì không bị gián đoạn, SePay cần biết chính xác địa chỉ API mới của bạn để bắn tín hiệu chuyển khoản thành công.

1. Đăng nhập vào trang quản trị cổng thanh toán **[SePay.vn](https://sepay.vn)**.
2. Tìm đến mục **Tích hợp Webhook** (Webhook Integration).
3. Nhấp chỉnh sửa Webhook đang hoạt động dành cho ứng dụng KenVideo của bạn.
4. Thay đổi ô **Địa chỉ nhận Webhook (URL)** thành liên kết đích mới:
   ```text
   https://mrkenmedia.vercel.app/api/webhooks/payment
   ```
5. Nhấn **Lưu cấu hình** để áp dụng thay đổi. 

*(Các mục thông số kỹ thuật khác giữ nguyên: Phương thức là `POST`, Kiểu dữ liệu là `JSON`, Secret Key trùng khớp với mã khóa bảo mật của bạn).*

---

## Bước 3: Cập Nhật Tên Miền Ủy Quyền trên Google Cloud Console

Để khách hàng không bị lỗi bảo mật `redirect_uri_mismatch` khi nhấn nút **Đăng nhập bằng tài khoản Google (OAuth 2.0)**, bạn phải đăng ký ủy quyền tên miền mới với Google.

1. Truy cập trang quản trị **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Đảm bảo chọn đúng dự án Google API mà ứng dụng đang kết nối.
3. Tại phân mục **OAuth 2.0 Client IDs**, nhấp vào nút **Chỉnh sửa (Edit)** hình chiếc bút chì bên cạnh Client ID của bạn.
4. Tại biểu mẫu hiện ra, kéo xuống dưới và cập nhật 2 mục sau bằng cách nhấp **Add URI (Thêm URI)**:
   * **Authorized JavaScript origins (Nguồn JavaScript được ủy quyền):**
     ```text
     https://mrkenmedia.vercel.app
     ```
   * **Authorized redirect URIs (URI chuyển hướng được ủy quyền):**
     ```text
     https://mrkenmedia.vercel.app/api/auth/callback/google
     ```
5. Kéo xuống dưới cùng và nhấn nút **Save (Lưu lại)**.

> [!NOTE]
> Phía máy chủ của Google API thông thường sẽ mất khoảng từ **2 đến 5 phút** để hoàn tất phân phối và kích hoạt cấu hình tên miền mới này trên toàn cầu.

---

*Tài liệu hướng dẫn kỹ thuật nội bộ dành cho KenVideo Stock Platform. Để in tài liệu này ra file PDF, bạn chỉ cần mở file [Huong_Dan_Doi_Ten_Mien.html](file:///i:/taophanmem/webapp%20ban%20FIle/Huong_Dan_Doi_Ten_Mien.html) bằng bất kỳ trình duyệt nào và nhấn nút "In tài liệu / Lưu file PDF" ở đầu trang.*
