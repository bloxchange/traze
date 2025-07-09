# Hướng Dẫn Sử Dụng

## Giới Thiệu
Chào mừng đến với Traze - nền tảng giao dịch toàn diện của bạn. Hướng dẫn này sẽ giúp bạn tìm hiểu về các tính năng và chức năng của nền tảng.

Traze là một nền tảng miễn phí, chỉ chạy trên môi trường trình duyệt và không yêu cầu thiết lập phía máy chủ (ngoại trừ các điểm cuối RPC Solana để gửi giao dịch). Nó sẽ không kết nối với bất kỳ dịch vụ bên ngoài nào, kể cả Google Analytics.

Traze không thể thay thế các sàn giao dịch. Nó giúp bạn giảm phí giao dịch. Tuy nhiên, những hạn chế của trình duyệt và điểm cuối RPC cá nhân khiến nó không phải là một sàn giao dịch đầy đủ tính năng. Bạn nên sử dụng cả Traze và các sàn giao dịch để tối đa hóa giá trị.

## Bắt Đầu
1. **Tổng Quan Bảng Điều Khiển**
   - Hai khu vực: Header và Không gian làm việc.
   - Header chứa danh sách thành phần và các mục điều hướng.
   - Bạn có thể kéo một thành phần từ danh sách vào không gian làm việc.
   - Bạn có thể thay đổi kích thước và sắp xếp các thành phần.
   - Bạn có thể thêm nhiều phiên bản của một thành phần.

2. **Header**
   - Danh sách thành phần ở giữa header, bao gồm: swarm ví, Thông tin Token, Pool Thanh khoản, Giao dịch. Danh sách thành phần sẽ được cập nhật theo lộ trình phát triển.
   - Các mục điều hướng nằm ở cạnh phải, bao gồm: hướng dẫn, lộ trình phát triển, FAQ, tìm kiếm token, cấu hình, chuyển đổi giao diện và chuyển đổi ngôn ngữ.

3. **Cấu Hình**
   - Bạn có thể truy cập cài đặt cấu hình từ header.
   - ***Bạn phải cấu hình các điểm cuối RPC để sử dụng nền tảng.***
   - Có 2 cách cập nhật số dư ví: Gọi RPC hoặc để Traze tự tính toán. Do giới hạn của RPC, việc để Traze tự tính toán sẽ tiết kiệm tài nguyên RPC của bạn. Bạn có thể sử dụng chức năng Làm mới để cập nhật số dư mới nhất.

## Tính Năng Chính

### Swarm
- Đây là một nhóm ví.
- Bạn có thể đặt tên cho nó.
- Bạn có thể thiết lập hồ sơ mua/bán cụ thể cho nó.
- Có danh sách các lệnh trong header: Sửa tên, Nạp tiền, Rút tiền, Thêm/Xóa ví, Làm mới, Cài đặt giao dịch.

1. Thêm/Xóa ví
   - Nhấp vào biểu tượng dấu cộng trong header của swarm.
   - Bạn có thể chọn nhập danh sách các khóa riêng tư hiện có, phân cách bằng dấu phẩy, hoặc nhập số lượng ví mới để tạo, hoặc cả hai.
   - Sau khi thêm, bạn có thể tải xuống danh sách ví đã tạo dưới dạng tệp văn bản.

2. Nạp tiền
   - Lệnh Nạp tiền cho phép bạn gửi SOL vào Swarm.
   - Bạn có thể chọn nạp tiền vào swarm từ ví Phantom hoặc một ví hiện có trong danh sách.
   - Nhập tổng số SOL cần nạp. Nó sẽ chia đều số tiền cho tất cả các ví trong swarm.

3. Rút tiền
   - Lệnh Rút tiền cho phép bạn rút SOL từ Swarm.
   - Bạn có thể chọn rút về ví Phantom hoặc một ví hiện có trong danh sách.
   - Tất cả SOL trong Swarm sẽ được rút ra.

4. Làm mới
   - Mặc định, Traze tính toán số dư sau mỗi giao dịch. Con số có thể không chính xác.
   - Chức năng Làm mới sẽ tải số dư mới nhất từ blockchain.

### Giao dịch
- Hiển thị tất cả các giao dịch đã gửi từ các swarm.

### Pool Thanh khoản
- Đang phát triển.