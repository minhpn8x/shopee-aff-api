import { createRoute, z } from '@hono/zod-openapi'

// ============================================================================
// 1. SCHEMAS: Convert Link Affiliate
// ============================================================================
export const ConvertLinkBodySchema = z
  .object({
    shopeeCookies: z
      .string()
      .optional()
      .openapi({
        example: '',
        description: '🟢 [TÙY CHỌN] Nếu bỏ trống sẽ dùng SHOPEE_COOKIE Secret trên Cloudflare',
      }),
    originalLink: z
      .array(
        z
          .string()
          .url('Mỗi đường dẫn gốc phải là một URL hợp lệ')
          .openapi({ example: 'https://shopee.vn/product/12345678/87654321' }),
      )
      .min(1, 'Cần ít nhất 1 link để convert')
      .max(5, 'Tối đa 5 link mỗi lượt convert')
      .openapi({
        description: '🔴 [BẮT BUỘC] Mảng chứa từ 1 đến 5 đường dẫn sản phẩm/chiến dịch Shopee',
        example: [
          'https://shopee.vn/product/12345678/87654321',
          'https://shopee.vn/product/88889999/11112222',
        ],
      }),
    subId1: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub1', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 1 (mặc định: "")' }),
    subId2: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub2', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 2 (mặc định: "")' }),
    subId3: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub3', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 3 (mặc định: "")' }),
    subId4: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub4', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 4 (mặc định: "")' }),
    subId5: z
      .string()
      .optional()
      .default('')
      .openapi({ example: 'sub5', description: '🟢 [TÙY CHỌN] Mã tracking sub_id 5 (mặc định: "")' }),
  })
  .openapi('ConvertLinkRequest', {
    example: {
      shopeeCookies: 'Dán cookies của bạn vào đây.',
      originalLink: [
        'https://shopee.vn/product/1453748726/41457868721',
        'https://s.shopee.vn/AKYyTrle9L',
      ],
    },
  })

export const ShopeeBatchCustomLinkItemSchema = z.object({
  shortLink: z.string().nullable().optional().openapi({ example: 'https://s.shopee.vn/xyz123' }),
  longLink: z.string().nullable().optional().openapi({ example: 'https://shope.ee/an_redir?...' }),
  failCode: z.number().openapi({ example: 0, description: '0 là thành công, khác 0 là mã lỗi Shopee' }),
})

export const ConvertLinkResponseSchema = z
  .object({
    data: z
      .object({
        batchCustomLink: z.array(ShopeeBatchCustomLinkItemSchema).optional(),
      })
      .optional(),
    errors: z
      .array(
        z.object({
          message: z.string().optional(),
        }),
      )
      .optional(),
  })
  .openapi('ConvertLinkResponse', {
    example: {
      data: {
        batchCustomLink: [
          {
            shortLink: 'https://s.shopee.vn/8fDxyz123',
            longLink:
              'https://shope.ee/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F12345678%2F87654321&affiliate_id=123456&sub_id=campaign_fb&sub_id2=banner_top&sub_id3=post_123&sub_id4=creator_01&sub_id5=sale_88',
            failCode: 0,
          },
          {
            shortLink: 'https://s.shopee.vn/8fDxyz456',
            longLink:
              'https://shope.ee/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F88889999%2F11112222&affiliate_id=123456&sub_id=campaign_fb&sub_id2=banner_top&sub_id3=post_123&sub_id4=creator_01&sub_id5=sale_88',
            failCode: 0,
          },
        ],
      },
    },
  })

// ============================================================================
// 2. SCHEMAS: Báo cáo Chuyển đổi (Conversion Reports)
// ============================================================================
export const ConversionReportsBodySchema = z
  .object({
    shopeeCookies: z
      .string()
      .min(1, 'shopeeCookies là bắt buộc')
      .openapi({
        example: '',
        description: '🔴 [BẮT BUỘC] Cookie từ tài khoản Shopee Affiliate',
      }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày bắt đầu phải là YYYY-MM-DD')
      .openapi({
        description: '🔴 [BẮT BUỘC] Ngày bắt đầu thống kê (YYYY-MM-DD)',
      }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày kết thúc phải là YYYY-MM-DD')
      .openapi({
        description: '🔴 [BẮT BUỘC] Ngày kết thúc thống kê (YYYY-MM-DD)',
      }),
    limit: z.union([z.literal(20), z.literal(40), z.literal(100)]).openapi({
      example: 20,
      description: '🔴 [BẮT BUỘC] Số lượng bản ghi mỗi trang, chỉ chấp nhận: 20, 40 hoặc 100',
    }),
    page: z
      .number()
      .int()
      .min(1)
      .openapi({
        example: 1,
        description: '🔴 [BẮT BUỘC] Số thứ tự trang hiện tại',
      }),
    order_id: z.string().optional().openapi({
      example: '',
      description: '🟢 [TÙY CHỌN] Mã đơn hàng Shopee; được gửi tới Shopee dưới tên order_sn',
    }),
    status: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional().openapi({
      example: 1,
      description:
        '🟢 [TÙY CHỌN] Trạng thái đơn hàng: 1 = Chờ xử lý (Pending), 2 = Đã hoàn thành (Completed), 3 = Đã huỷ (Cancelled), 4 = Chờ người dùng thanh toán (Unpaid)',
    }),
  })
  .openapi('ConversionReportsRequest')

const ConversionReportItemSchema = z.object({
  item_status: z.string().openapi({ example: 'CANCEL', description: 'Trạng thái nội bộ của sản phẩm' }),
  display_item_status: z.string().openapi({ example: 'Cancelled', description: 'Tên trạng thái sản phẩm để hiển thị' }),
  affiliate_item_status: z.number().openapi({ example: 3, description: 'Mã trạng thái affiliate của sản phẩm' }),
  shop_id: z.number().openapi({ example: 899855963, description: 'ID cửa hàng trên Shopee' }),
  shop_name: z.string().openapi({ example: 'Aya Mỹ phẩm giá gốc', description: 'Tên cửa hàng' }),
  promotion_id: z.string().openapi({ example: '', description: 'ID chương trình khuyến mãi' }),
  model_id: z.string().openapi({ example: '196102823517', description: 'ID phân loại sản phẩm' }),
  item_id: z.number().openapi({ example: 25879675339, description: 'ID sản phẩm trên Shopee' }),
  item_name: z.string().openapi({
    example: 'Dầu gội can to Smig 5000ml và 2000ml dùng siêu tiết kiệm , nhiều bọt , tơi tóc , suôn mượt.',
    description: 'Tên sản phẩm',
  }),
  item_price: z.number().openapi({ example: 27500000000, description: 'Giá sản phẩm theo đơn vị tiền nội bộ của Shopee' }),
  actual_amount: z.number().openapi({ example: 0, description: 'Giá trị mua thực tế theo đơn vị tiền nội bộ của Shopee' }),
  refunded_amount: z.number().openapi({ example: 23100000000, description: 'Số tiền hoàn lại theo đơn vị tiền nội bộ của Shopee' }),
  qty: z.number().openapi({ example: 0, description: 'Số lượng sản phẩm hợp lệ' }),
  img_code: z.string().openapi({ example: 'vn-11134207-7ra0g-magvvbsh5kuva0', description: 'Mã ảnh sản phẩm' }),
  item_commission: z.number().openapi({ example: 0, description: 'Hoa hồng của sản phẩm theo đơn vị nội bộ Shopee' }),
  capped_brand_commission: z.number().openapi({ example: 0, description: 'Hoa hồng thương hiệu sau khi áp dụng giới hạn' }),
  global_category_lv1_id: z.number().openapi({ example: 100630, description: 'ID danh mục cấp 1' }),
  global_category_lv2_id: z.number().openapi({ example: 100659, description: 'ID danh mục cấp 2' }),
  global_category_lv3_id: z.number().openapi({ example: 100869, description: 'ID danh mục cấp 3' }),
  global_category_lv1_name: z.string().openapi({ example: 'Sắc Đẹp', description: 'Tên danh mục cấp 1' }),
  global_category_lv2_name: z.string().openapi({ example: 'Chăm sóc tóc', description: 'Tên danh mục cấp 2' }),
  global_category_lv3_name: z.string().openapi({ example: 'Dầu gội', description: 'Tên danh mục cấp 3' }),
  is_fraud: z.number().openapi({ example: 0, description: 'Cờ đánh dấu gian lận' }),
  fraud_reason: z.string().openapi({ example: '', description: 'Lý do bị đánh dấu gian lận' }),
  fraud_status: z.number().openapi({ example: 2, description: 'Mã trạng thái kiểm tra gian lận' }),
  brand_commission_rate: z.number().openapi({ example: 2000, description: 'Tỷ lệ hoa hồng thương hiệu theo đơn vị nội bộ Shopee' }),
  platform_commission_rate: z.number().openapi({ example: 2500, description: 'Tỷ lệ hoa hồng nền tảng theo đơn vị nội bộ Shopee' }),
  attribution_type: z.number().openapi({ example: 3, description: 'Loại hình ghi nhận chuyển đổi' }),
  channel: z.number().openapi({ example: 1, description: 'Mã kênh phát sinh đơn hàng' }),
  campaign_mcn_brand_gross_commission: z.string().openapi({ example: '0', description: 'Tổng hoa hồng thương hiệu của chiến dịch MCN' }),
  campaign_type: z.number().openapi({ example: 5, description: 'Mã loại chiến dịch' }),
  ams_order_billing_rate: z.number().openapi({ example: 0, description: 'Tỷ lệ tính phí đơn hàng AMS' }),
  brand_origin_commission_rate: z.number().openapi({ example: 0, description: 'Tỷ lệ hoa hồng thương hiệu ban đầu' }),
  campaign_mcn_origin_commission_rate: z.number().openapi({ example: 0, description: 'Tỷ lệ hoa hồng MCN ban đầu' }),
  platform_calculation_type: z.number().openapi({ example: 1, description: 'Phương thức tính hoa hồng nền tảng' }),
  platform_commission_campaign_source: z.number().openapi({ example: 1, description: 'Nguồn chiến dịch hoa hồng nền tảng' }),
})

const ConversionReportOrderSchema = z.object({
  order_sn: z.string().openapi({ example: '260819RMXYFVVR', description: 'Mã đơn hàng hiển thị trên Shopee' }),
  order_id: z.string().openapi({ example: '240847148217240', description: 'ID đơn hàng nội bộ Shopee' }),
  order_status: z.string().openapi({ example: 'CANCEL', description: 'Trạng thái nội bộ của đơn hàng' }),
  shop_type: z.number().openapi({ example: 1, description: 'Mã loại cửa hàng' }),
  cancel_reason: z.string().openapi({ example: 'Cancelled by buyer', description: 'Lý do huỷ đơn hàng' }),
  display_order_status: z.number().openapi({ example: 3, description: 'Mã trạng thái hiển thị: 1 Pending, 2 Completed, 3 Cancelled, 4 Unpaid' }),
  complete_time: z.number().openapi({ example: 1787234349, description: 'Thời điểm hoàn tất/cập nhật đơn hàng dạng Unix timestamp' }),
  fraud_complete_time: z.number().openapi({ example: 1787197612, description: 'Thời điểm hoàn tất kiểm tra gian lận dạng Unix timestamp' }),
  affiliate_transaction_id: z.string().openapi({ example: '101177950101028528', description: 'ID giao dịch affiliate' }),
  shopee_order_status: z.number().openapi({ example: 3, description: 'Mã trạng thái đơn hàng phía Shopee' }),
  ams_order_billing_order_cap: z.number().openapi({ example: 0, description: 'Mức trần tính phí đơn hàng AMS' }),
  is_ams_order_billing_order_capped: z.boolean().openapi({ example: false, description: 'Đơn hàng AMS có bị giới hạn mức tính phí hay không' }),
  is_fixed_fee: z.boolean().openapi({ example: false, description: 'Đơn hàng có áp dụng mức phí cố định hay không' }),
  items: z.array(ConversionReportItemSchema).openapi({ description: 'Danh sách sản phẩm thuộc đơn hàng' }),
})

const ReportPaymentValidationInfoSchema = z.object({
  validation_cycle: z.number().openapi({ example: 0, description: 'Chu kỳ đối soát' }),
  estimate_validation_month: z.string().openapi({ example: '', description: 'Tháng dự kiến đối soát' }),
  estimate_validation_isoweek: z.number().openapi({ example: 0, description: 'Tuần ISO dự kiến đối soát' }),
  order_estimate_validation_period_start: z.number().openapi({ example: 0, description: 'Unix timestamp bắt đầu kỳ đối soát dự kiến' }),
  order_estimate_validation_period_end: z.number().openapi({ example: 0, description: 'Unix timestamp kết thúc kỳ đối soát dự kiến' }),
})

const ConversionReportEntrySchema = z.object({
  purchase_time: z.number().openapi({ example: 1787147948, description: 'Thời điểm mua hàng dạng Unix timestamp' }),
  checkout_id: z.string().openapi({ example: '240847148211698', description: 'ID lượt checkout' }),
  checkout_status: z.string().openapi({ example: 'Invalid', description: 'Trạng thái checkout' }),
  checkout_status_app: z.number().openapi({ example: 2, description: 'Mã trạng thái checkout trên ứng dụng' }),
  checkout_cap: z.number().openapi({ example: 4000000000, description: 'Giới hạn giá trị checkout theo đơn vị nội bộ Shopee' }),
  conversion_status: z.number().openapi({ example: 3, description: 'Mã trạng thái chuyển đổi' }),
  checkout_complete_time: z.number().openapi({ example: 1787234349, description: 'Thời điểm hoàn tất checkout dạng Unix timestamp' }),
  affiliate_id: z.number().openapi({ example: 17342207461, description: 'ID tài khoản affiliate' }),
  affiliate_name: z.string().openapi({ example: 'nguyenphiikhanh', description: 'Tên tài khoản affiliate' }),
  user_status: z.string().openapi({ example: 'Existing', description: 'Trạng thái người mua mới hoặc hiện hữu' }),
  ua_type: z.number().openapi({ example: 1, description: 'Mã loại user agent' }),
  gross_commission: z.number().openapi({ example: 0, description: 'Tổng hoa hồng gộp theo đơn vị nội bộ Shopee' }),
  capped_commission: z.number().openapi({ example: 0, description: 'Hoa hồng sau khi áp dụng giới hạn' }),
  total_brand_commission: z.number().openapi({ example: 0, description: 'Tổng hoa hồng thương hiệu' }),
  estimated_total_commission_with_mcn: z.number().openapi({ example: 0, description: 'Hoa hồng dự kiến bao gồm MCN' }),
  estimated_total_commission: z.number().openapi({ example: 0, description: 'Tổng hoa hồng dự kiến' }),
  utm_content: z.string().openapi({ example: 'vMpdArQY----', description: 'Giá trị tracking UTM content/subId' }),
  content_type: z.string().openapi({ example: '', description: 'Loại nội dung tạo chuyển đổi' }),
  device: z.string().openapi({ example: 'App', description: 'Thiết bị/kênh thực hiện giao dịch' }),
  referrer: z.string().openapi({
    example: '{"internal_source":"","direct_source":"Zalo","indirect_source":"","first_external_source":"","last_external_source":"Zalo"}',
    description: 'Thông tin nguồn giới thiệu ở dạng chuỗi JSON',
  }),
  orders: z.array(ConversionReportOrderSchema).openapi({ description: 'Danh sách đơn hàng của lượt chuyển đổi' }),
  click_time: z.number().openapi({ example: 1787147916, description: 'Thời điểm click link affiliate dạng Unix timestamp' }),
  click_id: z.string().openapi({ example: '8024592264c57e8f7db130eee811a617', description: 'ID của lượt click' }),
  product_type: z.string().openapi({ example: 'mp', description: 'Loại sản phẩm/marketplace' }),
  internal_source: z.string().openapi({ example: '', description: 'Nguồn traffic nội bộ' }),
  indirect_source: z.string().openapi({ example: '', description: 'Nguồn traffic gián tiếp' }),
  direct_source: z.string().openapi({ example: 'Zalo', description: 'Nguồn traffic trực tiếp' }),
  last_external_source: z.string().openapi({ example: 'Zalo', description: 'Nguồn bên ngoài gần nhất' }),
  first_external_source: z.string().openapi({ example: '', description: 'Nguồn bên ngoài đầu tiên' }),
  is_shopee_capped: z.boolean().openapi({ example: false, description: 'Hoa hồng có bị Shopee áp dụng giới hạn hay không' }),
  attribution_type: z.number().openapi({ example: 2, description: 'Loại hình ghi nhận chuyển đổi' }),
  estimated_validation_month: z.string().openapi({ example: '', description: 'Tháng dự kiến đối soát' }),
  report_payment_validation_info: ReportPaymentValidationInfoSchema,
  affiliate_net_commission: z.string().openapi({ example: '0', description: 'Hoa hồng ròng của affiliate' }),
  mcn_management_fee_commission: z.string().openapi({ example: '0', description: 'Hoa hồng phí quản lý MCN' }),
  mcn_management_fee_seller_commission: z.string().openapi({ example: '0', description: 'Hoa hồng người bán thuộc phí quản lý MCN' }),
  mcn_agreement_id: z.string().openapi({ example: '0', description: 'ID thoả thuận MCN' }),
  campaign_mcn_id: z.string().openapi({ example: '0', description: 'ID chiến dịch MCN' }),
  campaign_mcn_name: z.string().openapi({ example: '', description: 'Tên chiến dịch MCN' }),
  linked_mcn_id: z.string().openapi({ example: '0', description: 'ID MCN liên kết' }),
  linked_mcn_name: z.string().openapi({ example: '', description: 'Tên MCN liên kết' }),
  linked_mcn_commission_rate: z.string().openapi({ example: '0', description: 'Tỷ lệ hoa hồng MCN liên kết' }),
  tenant: z.number().openapi({ example: 1, description: 'Mã tenant/thị trường Shopee' }),
  app_type: z.number().openapi({ example: 1, description: 'Mã loại ứng dụng' }),
  traffic_type: z.number().openapi({ example: 0, description: 'Mã loại traffic' }),
  eligible_seller_commission: z.string().openapi({ example: '0', description: 'Hoa hồng người bán đủ điều kiện' }),
})

export const ConversionReportsResponseSchema = z
  .object({
    code: z.number().openapi({ example: 0, description: 'Mã kết quả; 0 là thành công' }),
    msg: z.string().openapi({ example: 'success', description: 'Thông báo kết quả từ Shopee' }),
    data: z.object({
      page_num: z.number().openapi({ example: 1, description: 'Trang hiện tại' }),
      page_size: z.number().openapi({ example: 20, description: 'Số bản ghi mỗi trang' }),
      total_count: z.number().openapi({ example: 1, description: 'Tổng số bản ghi phù hợp' }),
      list: z.array(ConversionReportEntrySchema).openapi({ description: 'Danh sách conversion report' }),
    }),
  })
  .openapi('ConversionReportsResponse', {
    description: 'Phản hồi báo cáo chuyển đổi thành công từ Shopee Affiliate API',
  })

// ============================================================================
// ERROR SCHEMAS: 400 Validation Error & 403 Forbidden Error (Shopee Cookie Error)
// ============================================================================
export const ErrorResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: false }),
    error: z.object({
      code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
      message: z.string().openapi({ example: 'Dữ liệu yêu cầu không hợp lệ' }),
      issues: z.array(z.any()).optional(),
    }),
  })
  .openapi('ValidationErrorResponse')

export const ShopeeForbiddenErrorSchema = z
  .object({
    is_customized: z.boolean().openapi({ example: false }),
    is_login: z.boolean().openapi({ example: false }),
    action_type: z.number().openapi({ example: 2 }),
    error: z.number().openapi({
      example: 90309999,
      description: 'Mã lỗi Shopee (90309999: Chưa đăng nhập hoặc Cookie hết hạn)',
    }),
    tracking_id: z.string().openapi({ example: '461affbb6d8-d3f6-45b8-af44-e049b879ca09' }),
    redirect_to_error_page: z.boolean().openapi({ example: true }),
  })
  .openapi('ShopeeForbiddenErrorResponse')

// ============================================================================
// 1. ROUTE: Convert Link Affiliate (POST)
// ============================================================================
export const convertLinkRoute = createRoute({
  method: 'post',
  path: '/convert-link',
  operationId: 'convertLinkAffiliate',
  tags: ['Shopee Affiliate'],
  summary: 'Convert Link Affiliate',
  description:
    'Chuyển đổi mảng tối đa 5 link Shopee cùng lúc kèm tracking subId1 -> subId5 qua GraphQL batchCustomLink.\n\n' +
    '**Chi tiết Body:**\n' +
    '- 🔴 `shopeeCookies` (**Bắt buộc**): Cookie đăng nhập Shopee Affiliate.\n' +
    '- 🔴 `originalLink` (**Bắt buộc**): Mảng từ 1 đến 5 đường dẫn sản phẩm/chiến dịch Shopee hợp lệ.\n' +
    '- 🟢 `subId1` .. `subId5` (**Tùy chọn**): Các mã tracking mở rộng.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConvertLinkBodySchema,
        },
      },
      required: true,
      description: 'Request body chứa shopeeCookies, originalLink (bắt buộc) và subId1..subId5 (tùy chọn)',
    },
  },
  responses: {
    200: {
      description: 'Thành công (Trả về danh sách shortLink & longLink tương ứng)',
      content: {
        'application/json': {
          schema: ConvertLinkResponseSchema,
        },
      },
    },
    400: {
      description: 'Dữ liệu gửi lên không hợp lệ hoặc thiếu shopeeCookies',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Lỗi xác thực Shopee (Cookie không hợp lệ, hết hạn hoặc chưa đăng nhập)',
      content: {
        'application/json': {
          schema: ShopeeForbiddenErrorSchema,
        },
      },
    },
  },
})

// ============================================================================
// 2. ROUTE: Báo cáo Chuyển đổi (Conversion Reports) (POST)
// ============================================================================
export const conversionReportsRoute = createRoute({
  method: 'post',
  path: '/conversion-reports',
  operationId: 'postConversionReports',
  tags: ['Shopee Affiliate'],
  summary: 'Báo cáo Chuyển đổi (Conversion Reports)',
  description:
    'Truy xuất báo cáo đơn hàng từ Shopee Affiliate.\n\n' +
    '**Chi tiết Body:**\n' +
    '- 🔴 `shopeeCookies` (**Bắt buộc**): Cookie đăng nhập Shopee Affiliate.\n' +
    '- 🔴 `startDate` (**Bắt buộc**): Ngày bắt đầu theo định dạng `YYYY-MM-DD`, được chuyển thành đầu ngày theo giờ Việt Nam.\n' +
    '- 🔴 `endDate` (**Bắt buộc**): Ngày kết thúc theo định dạng `YYYY-MM-DD`, được chuyển thành cuối ngày theo giờ Việt Nam.\n' +
    '- 🔴 `limit` (**Bắt buộc**): Số bản ghi mỗi trang, chỉ chấp nhận `20`, `40` hoặc `100`.\n' +
    '- 🔴 `page` (**Bắt buộc**): Số thứ tự trang, mặc định là `1`.\n' +
    '- 🟢 `order_id` (**Tùy chọn**): Mã đơn hàng Shopee.\n' +
    '- 🟢 `status` (**Tùy chọn**): `1` Chờ xử lý (Pending), `2` Đã hoàn thành (Completed), `3` Đã huỷ (Cancelled), `4` Chờ người dùng thanh toán (Unpaid).',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConversionReportsBodySchema,
        },
      },
      required: true,
      description: 'Thông tin bộ lọc báo cáo và shopeeCookies',
    },
  },
  responses: {
    200: {
      description: 'Truy xuất báo cáo chuyển đổi thành công',
      content: {
        'application/json': {
          schema: ConversionReportsResponseSchema,
        },
      },
    },
    400: {
      description: 'Dữ liệu gửi lên không hợp lệ hoặc thiếu shopeeCookies',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Lỗi xác thực Shopee (Cookie không hợp lệ, hết hạn hoặc chưa đăng nhập)',
      content: {
        'application/json': {
          schema: ShopeeForbiddenErrorSchema,
        },
      },
    },
  },
})

export type ConvertLinkRoute = typeof convertLinkRoute
export type ConversionReportsRoute = typeof conversionReportsRoute
