import type { AppRouteHandler } from '../../lib/types'
import type {
  ConversionReportsRoute,
  ConvertLinkRoute,
} from './affiliate.routes'

// ============================================================
// 1. Handler: Convert Link Affiliate
// Hỗ trợ tối đa 5 link & advancedLinkParams subId1 -> subId5
// ============================================================

export const convertLinkHandler: AppRouteHandler<ConvertLinkRoute> = async (c) => {
  const {
    shopeeCookies,
    originalLink,
    subId1,
    subId2,
    subId3,
    subId4,
    subId5,
  } = c.req.valid('json')

  // Ưu tiên Cookie lưu trong Cloudflare Secret.
  // Nếu chưa có Secret thì fallback sang cookie gửi trong request body.
  const effectiveShopeeCookie = String(
    c.env?.SHOPEE_COOKIE || shopeeCookies || '',
  ).trim()

  if (!effectiveShopeeCookie) {
    return c.json(
      {
        success: false,
        error: {
          code: 'MISSING_SHOPEE_COOKIE',
          message:
            'Chưa cấu hình SHOPEE_COOKIE Secret trên Cloudflare và request cũng không có shopeeCookies',
        },
      },
      400,
    )
  }

  const shopeeBaseApi =
    c.env?.SHOPEE_BASE_API || 'https://affiliate.shopee.vn/api/v3'

  // Chuẩn hóa endpoint
  const baseUrl = shopeeBaseApi.replace(/\/+$/, '')

  const endpoint = baseUrl.includes('/gql')
    ? baseUrl
    : `${baseUrl}/gql?q=batchCustomLink`

  const query = `
    query batchGetCustomLink(
      $linkParams: [CustomLinkParam!],
      $sourceCaller: SourceCaller
    ) {
      batchCustomLink(
        linkParams: $linkParams,
        sourceCaller: $sourceCaller
      ) {
        shortLink
        longLink
        failCode
      }
    }
  `

  const formattedLinkParams = originalLink
    .slice(0, 5)
    .map((link) => ({
      originalLink: link,
      advancedLinkParams: {
        subId1: subId1 || '',
        subId2: subId2 || '',
        subId3: subId3 || '',
        subId4: subId4 || '',
        subId5: subId5 || '',
      },
    }))

  const payload = {
    operationName: 'batchGetCustomLink',
    query,
    variables: {
      linkParams: formattedLinkParams,
      sourceCaller: 'CUSTOM_LINK_CALLER',
    },
  }

  const response = await fetch(endpoint, {
    method: 'POST',

    headers: {
      accept: '*/*',
      'content-type': 'application/json',

      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/133.0.0.0 Safari/537.36',

      'sec-fetch-dest': 'empty',
      'sec-fetch-site': 'same-origin',

      'sec-ch-ua':
        '"Google Chrome";v="149", ' +
        '"Chromium";v="149", ' +
        '"Not)A;Brand";v="24"',

      cookie: effectiveShopeeCookie,
    },

    body: JSON.stringify(payload),
  })

  // Đọc response dưới dạng text trước.
  // Tránh crash nếu Shopee trả HTML hoặc nội dung không phải JSON.
  const rawText = await response.text()

  try {
    const json = JSON.parse(rawText)

    return c.json(
      json,
      response.status as any,
    )
  } catch {
    return c.json(
      {
        error: 'NON_JSON_RESPONSE',
        status: response.status,
        message:
          'Shopee trả về phản hồi không phải JSON (có thể do Cookie không hợp lệ, hết hạn hoặc request bị chặn)',
        raw: rawText,
      },
      response.status as any,
    )
  }
}

// ============================================================
// 2. Handler: Báo cáo Chuyển đổi
// Conversion Reports
// ============================================================

export const conversionReportsHandler: AppRouteHandler<
  ConversionReportsRoute
> = async (c) => {
  const {
    shopeeCookies,
    startDate,
    endDate,
    limit,
    page,
    order_id,
    status,
  } = c.req.valid('json')

  const shopeeBaseApi =
    c.env?.SHOPEE_BASE_API || 'https://affiliate.shopee.vn/api/v3'

  // Shopee Vietnam dùng UTC+7:
  // đầu ngày cho thời gian bắt đầu
  // cuối ngày cho thời gian kết thúc
  const purchaseTimeStart = Math.floor(
    new Date(`${startDate}T00:00:00+07:00`).getTime() / 1000,
  )

  const purchaseTimeEnd = Math.floor(
    new Date(`${endDate}T23:59:59+07:00`).getTime() / 1000,
  )

  if (
    !Number.isFinite(purchaseTimeStart) ||
    !Number.isFinite(purchaseTimeEnd)
  ) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate hoặc endDate không hợp lệ',
        },
      },
      400,
    )
  }

  if (purchaseTimeStart > purchaseTimeEnd) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate không được lớn hơn endDate',
        },
      },
      400,
    )
  }

  const baseUrl = shopeeBaseApi.replace(/\/+$/, '')

  const endpoint = new URL(
    baseUrl.endsWith('/report/list')
      ? baseUrl
      : `${baseUrl}/report/list`,
  )

  const searchParams = new URLSearchParams({
    page_num: String(page),
    page_size: String(limit),
    purchase_time_s: String(purchaseTimeStart),
    purchase_time_e: String(purchaseTimeEnd),
    version: '1',
  })

  if (order_id?.trim()) {
    searchParams.set(
      'order_sn',
      order_id.trim(),
    )
  }

  if (status !== undefined) {
    searchParams.set(
      'order_status',
      String(status),
    )
  }

  endpoint.search = searchParams.toString()

  const response = await fetch(endpoint, {
    method: 'GET',

    headers: {
      accept: '*/*',
      'content-type': 'application/json',

      // Conversion Reports vẫn giữ nguyên cookie
      // được gửi trong request body.
      cookie: shopeeCookies,

      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/133.0.0.0 Safari/537.36',

      'sec-fetch-dest': 'empty',
      'sec-fetch-site': 'same-origin',

      'sec-ch-ua':
        '"Google Chrome";v="149", ' +
        '"Chromium";v="149", ' +
        '"Not)A;Brand";v="24"',
    },
  })

  const rawText = await response.text()

  try {
    return c.json(
      JSON.parse(rawText),
      response.status as any,
    )
  } catch {
    return c.json(
      {
        error: 'NON_JSON_RESPONSE',
        status: response.status,
        message:
          'Shopee trả về phản hồi không phải JSON (có thể do Cookie không hợp lệ hoặc bị chặn)',
        raw: rawText,
      },
      response.status as any,
    )
  }
}
